import json

import httpx
from uuid6 import uuid7

from app.models import Card, CardResponse, Decision
from tests.conftest import add_cards, jev_override, make_jev_client


class FakeJev:
    """Records requests; scores "Music" candidates high and everything else low."""

    def __init__(self):
        self.bodies: list[dict] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        self.bodies.append(body)
        names = {c["id"]: c["event_name"] for c in body["state"]["candidates"]}
        answers = {
            question_id: {
                "type": "noul",
                "noul": 0.9 if names[question_id].startswith("Music") else 0.1,
            }
            for question_id in body["questions"]
        }
        return httpx.Response(200, json={"answers": answers})


async def answer(factory, user_id, cards, decision):
    async with factory() as session:
        session.add_all(
            CardResponse(user_id=user_id, card_id=card.id, decision=decision) for card in cards
        )
        await session.commit()


async def seeded_cards(factory):
    from sqlalchemy import select

    async with factory() as session:
        return list((await session.scalars(select(Card).order_by(Card.event_name))).all())


async def test_ten_best_of_fifty_using_history(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await add_cards(session_factory, 60)
    user = uuid7()
    seeded = await seeded_cards(session_factory)
    seeded = [c for c in seeded if not c.event_name.startswith(("Music", "Sport"))]
    await answer(session_factory, user, seeded[:2], Decision.RIGHT)
    await answer(session_factory, user, seeded[2:4], Decision.LEFT)
    answered_ids = {str(c.id) for c in seeded[:4]}

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    cards = response.json()
    assert len(cards) == 10
    assert len({c["id"] for c in cards}) == 10
    assert all(c["event_name"].startswith("Music") for c in cards)
    assert not answered_ids & {c["id"] for c in cards}

    body = fake.bodies[0]
    assert len(body["questions"]) == 50
    assert len(body["state"]["liked"]) == 2
    assert len(body["state"]["disliked"]) == 2
    assert len(body["state"]["candidates"]) == 50
    raw = json.dumps(body)
    assert str(user) not in raw
    assert "test-key" not in raw


async def test_user_without_answers_gets_ten_cards_without_calling_jev(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await add_cards(session_factory, 60)

    response = await db_client.get(f"/card/recommendations/{uuid7()}")

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert fake.bodies == []


async def test_invalid_user_id_is_rejected_without_calling_jev(db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))

    response = await db_client.get("/card/recommendations/not-a-uuid")

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
    assert fake.bodies == []


# --- User Story 2: small data never fails ---


async def test_thirty_unanswered_cards_gives_ten(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await add_cards(session_factory, 25)
    user = uuid7()
    seeded = await seeded_cards(session_factory)
    first_seed = [c for c in seeded if not c.event_name.startswith(("Music", "Sport"))][:1]
    await answer(session_factory, user, first_seed, Decision.RIGHT)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert len(fake.bodies[0]["questions"]) == 30


async def test_six_unanswered_cards_returns_all_six(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    extra = await add_cards(session_factory, 1)
    user = uuid7()
    await answer(session_factory, user, extra, Decision.LEFT)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 6
    assert len(fake.bodies[0]["questions"]) == 6


async def test_all_cards_answered_gives_empty_list(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    user = uuid7()
    await answer(session_factory, user, await seeded_cards(session_factory), Decision.RIGHT)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert response.json() == []
    assert fake.bodies == []


async def test_at_most_fifty_candidates_are_sent(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await add_cards(session_factory, 60)
    user = uuid7()
    await answer(session_factory, user, (await add_cards(session_factory, 1)), Decision.RIGHT)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(fake.bodies[0]["questions"]) == 50


# --- User Story 3: a bad AI answer never breaks the result ---


async def history_for(session_factory, count=2):
    user = uuid7()
    extra = await add_cards(session_factory, 60)
    await answer(session_factory, user, extra[:count], Decision.RIGHT)
    return user


def failing_handlers():
    def http_500(request):
        return httpx.Response(500, json={"error": "boom"})

    def timeout(request):
        raise httpx.ReadTimeout("slow", request=request)

    def invalid_json(request):
        return httpx.Response(200, text="not json")

    return {"http_500": http_500, "timeout": timeout, "invalid_json": invalid_json}


async def test_jev_failures_still_return_ten_cards(session_factory, db_client):
    user = await history_for(session_factory)
    for name, handler in failing_handlers().items():
        jev_override(make_jev_client(handler))
        response = await db_client.get(f"/card/recommendations/{user}")
        assert response.status_code == 200, name
        cards = response.json()
        assert len(cards) == 10, name
        assert len({c["id"] for c in cards}) == 10, name


async def test_missing_api_key_still_returns_ten_cards(session_factory, db_client):
    from app.jev_client import JevClient

    user = await history_for(session_factory)
    jev_override(JevClient(api_key=None, model="m", url="https://jev.test", timeout=1.0))

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 10


async def test_partial_answers_are_ranked_first_and_filled_up(session_factory, db_client):
    user = await history_for(session_factory)
    asked = {}

    def handler(request):
        ids = list(json.loads(request.content)["questions"])
        asked["top"] = ids[:3]
        answers = {ids[0]: 0.7, ids[1]: 0.9, ids[2]: 0.8}
        return httpx.Response(
            200, json={"answers": {k: {"type": "noul", "noul": v} for k, v in answers.items()}}
        )

    jev_override(make_jev_client(handler))
    response = await db_client.get(f"/card/recommendations/{user}")

    cards = response.json()
    assert len(cards) == 10
    assert [c["id"] for c in cards[:3]] == [asked["top"][1], asked["top"][2], asked["top"][0]]
    assert len({c["id"] for c in cards}) == 10


async def test_unknown_ids_and_out_of_range_values_are_ignored(session_factory, db_client):
    user = await history_for(session_factory)
    unknown = str(uuid7())

    def handler(request):
        ids = list(json.loads(request.content)["questions"])
        answers = {unknown: 1.0, ids[0]: 1.7, ids[1]: 0.6}
        return httpx.Response(
            200, json={"answers": {k: {"type": "noul", "noul": v} for k, v in answers.items()}}
        )

    jev_override(make_jev_client(handler))
    response = await db_client.get(f"/card/recommendations/{user}")

    cards = response.json()
    assert response.status_code == 200
    assert len(cards) == 10
    assert unknown not in {c["id"] for c in cards}


async def test_api_key_never_appears_in_logs(session_factory, db_client, capsys):
    user = await history_for(session_factory)

    def handler(request):
        return httpx.Response(401, json={"error": "bad key test-key"})

    jev_override(make_jev_client(handler))
    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    output = capsys.readouterr()
    logs = output.out + output.err
    assert "jev_failed" in logs
    assert "test-key" not in logs
