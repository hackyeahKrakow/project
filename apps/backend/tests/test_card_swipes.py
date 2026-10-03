from sqlalchemy import select
from uuid6 import uuid7

from app.models import CardSwipe
from app.seed import SEED_CARDS


async def rows(factory) -> list[CardSwipe]:
    async with factory() as session:
        return list((await session.scalars(select(CardSwipe))).all())


def answer(client, user, card_id, decision):
    return client.post(f"/card/{user}", json={"card_id": str(card_id), "decision": decision})


async def test_right_swipe_is_saved_as_true(session_factory, db_client):
    user = uuid7()

    response = await answer(db_client, user, SEED_CARDS[0].id, "right")

    assert response.status_code == 201
    body = response.json()
    assert body["decision"] == "right"
    assert body["card_id"] == str(SEED_CARDS[0].id)
    assert body["user_id"] == str(user)
    assert body["created_at"]
    saved = await rows(session_factory)
    assert len(saved) == 1
    assert saved[0].swipe is True


async def test_left_swipe_is_saved_as_false(session_factory, db_client):
    response = await answer(db_client, uuid7(), SEED_CARDS[1].id, "left")

    assert response.status_code == 201
    assert response.json()["decision"] == "left"
    saved = await rows(session_factory)
    assert [s.swipe for s in saved] == [False]


async def test_each_answered_card_gets_its_own_row(session_factory, db_client):
    user = uuid7()
    for card in SEED_CARDS[:3]:
        assert (await answer(db_client, user, card.id, "right")).status_code == 201

    saved = await rows(session_factory)
    assert len(saved) == 3
    assert {s.card_id for s in saved} == {c.id for c in SEED_CARDS[:3]}


# --- User Story 2: records are complete and trustworthy ---


async def test_unknown_card_is_404_and_saves_nothing(session_factory, db_client):
    response = await answer(db_client, uuid7(), uuid7(), "right")

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}
    assert await rows(session_factory) == []


async def test_invalid_input_is_422_and_saves_nothing(session_factory, db_client):
    user = uuid7()
    bad_decision = await answer(db_client, user, SEED_CARDS[0].id, "up")
    bad_card_id = await answer(db_client, user, "123", "left")
    bad_user = await answer(db_client, "not-a-uuid", SEED_CARDS[0].id, "left")

    for response in (bad_decision, bad_card_id, bad_user):
        assert response.status_code == 422
        assert isinstance(response.json()["detail"], str)
    assert await rows(session_factory) == []


async def test_repeat_answer_is_409_and_keeps_the_first_record(session_factory, db_client):
    user = uuid7()
    first = await answer(db_client, user, SEED_CARDS[0].id, "right")
    original = (await rows(session_factory))[0]

    second = await answer(db_client, user, SEED_CARDS[0].id, "left")

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json() == {"detail": "Card already answered"}
    saved = await rows(session_factory)
    assert len(saved) == 1
    assert saved[0].swipe is True
    assert saved[0].created_at == original.created_at


async def test_created_at_is_set_by_the_service_in_utc(session_factory, db_client):
    from datetime import datetime, timedelta, timezone

    before = datetime.now(timezone.utc) - timedelta(seconds=1)
    await answer(db_client, uuid7(), SEED_CARDS[0].id, "right")
    after = datetime.now(timezone.utc) + timedelta(seconds=1)

    created_at = (await rows(session_factory))[0].created_at
    assert created_at.tzinfo is not None
    assert created_at.utcoffset() == timedelta(0)
    assert before <= created_at <= after


async def test_created_at_sent_by_the_client_is_ignored(session_factory, db_client):
    from datetime import datetime, timedelta, timezone

    response = await db_client.post(
        f"/card/{uuid7()}",
        json={
            "card_id": str(SEED_CARDS[0].id),
            "decision": "right",
            "created_at": "2000-01-01T00:00:00Z",
        },
    )

    assert response.status_code == 201
    created_at = (await rows(session_factory))[0].created_at
    assert datetime.now(timezone.utc) - created_at < timedelta(seconds=5)


async def test_identical_concurrent_answers_save_exactly_one_row(session_factory, db_client):
    import asyncio

    user = uuid7()
    responses = await asyncio.gather(
        *(answer(db_client, user, SEED_CARDS[0].id, "right") for _ in range(5))
    )

    codes = sorted(r.status_code for r in responses)
    assert codes == [201, 409, 409, 409, 409]
    assert len(await rows(session_factory)) == 1


async def test_two_users_can_answer_the_same_card(session_factory, db_client):
    for _ in range(2):
        assert (await answer(db_client, uuid7(), SEED_CARDS[0].id, "left")).status_code == 201

    assert len(await rows(session_factory)) == 2


async def test_answers_survive_a_restart(db_path):
    from tests.conftest import make_client, make_database

    user = uuid7()
    engine, factory = await make_database(db_path)
    async with make_client(factory) as client:
        await answer(client, user, SEED_CARDS[0].id, "right")
    await engine.dispose()

    engine, factory = await make_database(db_path)
    saved = await rows(factory)
    await engine.dispose()
    assert [(s.user_id, s.card_id, s.swipe) for s in saved] == [(user, SEED_CARDS[0].id, True)]
