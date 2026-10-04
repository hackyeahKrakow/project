import json

from sqlalchemy import func, select
from uuid6 import uuid7

from app.info_service import MAX_INFO_CHARS
from app.models import Decision, UserInfo
from tests.conftest import jev_override, make_jev_client
from tests.test_recommendations import FakeJev, answer, seeded_cards

CHOICES = {"interests": ["koncerty", "kabaret"], "budget": "do 50 zł", "nested": {"a": [1, 2, None]}}


async def post_info(client, user, body):
    return await client.post(f"/info/{user}", json=body)


async def test_saves_json_and_reports_when(db_client, session_factory):
    user = uuid7()

    response = await post_info(db_client, user, CHOICES)

    assert response.status_code == 200
    assert response.json()["user_id"] == str(user)
    assert response.json()["updated_at"].endswith("Z") or "+" in response.json()["updated_at"]
    async with session_factory() as session:
        row = await session.get(UserInfo, user)
    assert json.loads(row.data) == CHOICES


async def test_a_second_post_replaces_the_first(db_client, session_factory):
    user = uuid7()
    await post_info(db_client, user, {"v": 1})

    await post_info(db_client, user, {"v": 2})

    async with session_factory() as session:
        assert await session.scalar(select(func.count()).select_from(UserInfo)) == 1
        assert json.loads((await session.get(UserInfo, user)).data) == {"v": 2}


async def test_any_json_value_is_accepted(db_client):
    for body in ([1, "two", {"three": 3}], "just text", 42, {}):
        assert (await post_info(db_client, uuid7(), body)).status_code == 200


async def test_invalid_requests_are_rejected(db_client):
    user = uuid7()

    not_json = await db_client.post(f"/info/{user}", content=b"{broken", headers={"content-type": "application/json"})
    empty = await db_client.post(f"/info/{user}")
    bad_user = await post_info(db_client, "not-a-uuid", {"a": 1})

    for response in (not_json, empty, bad_user):
        assert response.status_code == 422
        assert isinstance(response.json()["detail"], str)


async def test_too_large_json_is_rejected_and_not_saved(db_client, session_factory):
    user = uuid7()

    response = await post_info(db_client, user, {"text": "x" * MAX_INFO_CHARS})

    assert response.status_code == 413
    async with session_factory() as session:
        assert await session.get(UserInfo, user) is None


async def test_saved_json_reaches_jev_as_the_users_choices(db_client, session_factory):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    user = uuid7()
    await post_info(db_client, user, CHOICES)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(fake.bodies) == 1  # choices alone are enough to ask Jev, no swipes needed
    state = fake.bodies[0]["state"]
    assert state["choices"] == CHOICES
    assert state["liked"] == [] and state["disliked"] == []
    raw = json.dumps(fake.bodies[0])
    assert str(user) not in raw  # the user id never goes to the AI


async def test_choices_and_answers_are_sent_together(db_client, session_factory):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    user = uuid7()
    await post_info(db_client, user, CHOICES)
    await answer(session_factory, user, (await seeded_cards(session_factory))[:2], Decision.RIGHT)

    await db_client.get(f"/card/recommendations/{user}")

    state = fake.bodies[0]["state"]
    assert state["choices"] == CHOICES
    assert len(state["liked"]) == 2


async def test_without_choices_or_answers_jev_is_not_called(db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))

    await db_client.get(f"/card/recommendations/{uuid7()}")

    assert fake.bodies == []


async def test_other_users_choices_are_not_used(db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await post_info(db_client, uuid7(), CHOICES)

    await db_client.get(f"/card/recommendations/{uuid7()}")

    assert fake.bodies == []
