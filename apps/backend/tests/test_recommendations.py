import json

import httpx
from uuid6 import uuid7

from app.models import Card, CardSwipe, Decision
from app.seed import SEED_CARDS
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
            CardSwipe(user_id=user_id, card_id=card.id, swipe=decision is Decision.RIGHT)
            for card in cards
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
    await add_cards(session_factory, max(0, 31 - len(SEED_CARDS)))
    user = uuid7()
    cards = await seeded_cards(session_factory)
    await answer(session_factory, user, cards[: len(cards) - 30], Decision.RIGHT)  # leave exactly 30 unanswered

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert len(fake.bodies[0]["questions"]) == 30


async def test_six_unanswered_cards_returns_all_six(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    seeded = await seeded_cards(session_factory)
    extra = await add_cards(session_factory, 1)
    user = uuid7()
    # leave exactly six cards unanswered: everything but the last six seeded cards
    await answer(session_factory, user, extra + seeded[:-6], Decision.LEFT)

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


# --- answers saved through POST feed the recommendations ---


async def test_answers_posted_through_the_api_drive_recommendations(session_factory, db_client):
    fake = FakeJev()
    jev_override(make_jev_client(fake))
    await add_cards(session_factory, 60)
    user = uuid7()
    seeded = [
        c
        for c in await seeded_cards(session_factory)
        if not c.event_name.startswith(("Music", "Sport"))
    ]
    liked_card, disliked_card = seeded[0], seeded[1]
    for card, decision in ((liked_card, "right"), (disliked_card, "left")):
        response = await db_client.post(
            f"/card/{user}", json={"card_id": str(card.id), "decision": decision}
        )
        assert response.status_code == 201

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    ids = {c["id"] for c in response.json()}
    assert str(liked_card.id) not in ids
    assert str(disliked_card.id) not in ids
    state = fake.bodies[0]["state"]
    assert [item["id"] for item in state["liked"]] == [str(liked_card.id)]
    assert [item["id"] for item in state["disliked"]] == [str(disliked_card.id)]


# --- Fallback model: Jev's low-confidence cards are decided by gpt-4o-mini on OpenRouter ---


class UncertainJev:
    """Jev is sure about "Music" (0.9) and "Sport" (0.1) cards and unsure about the rest (0.55)."""

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        names = {c["id"]: c["event_name"] for c in body["state"]["candidates"]}

        def probability(name: str) -> float:
            return 0.9 if name.startswith("Music") else 0.1 if name.startswith("Sport") else 0.55

        answers = {
            question_id: {"type": "noul", "noul": probability(names[question_id])}
            for question_id in body["questions"]
        }
        return httpx.Response(200, json={"answers": answers})


class FakeOpenRouter:
    """Says yes to candidates with "Pick" in the name; records requests."""

    def __init__(self, reply=None):
        self.requests: list[httpx.Request] = []
        self.bodies: list[dict] = []
        self.reply = reply

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        self.requests.append(request)
        self.bodies.append(body)
        if self.reply is not None:
            return self.reply(request)
        state = json.loads(body["messages"][1]["content"])
        decisions = {c["id"]: "Pick" in c["event_name"] for c in state["candidates"]}
        return httpx.Response(
            200, json={"choices": [{"message": {"content": json.dumps({"decisions": decisions})}}]}
        )


def decider_override(handler):
    from app.fallback_decider import FallbackDecider, get_fallback_decider
    from app.main import app

    decider = FallbackDecider(
        api_key="or-key",
        model="openai/gpt-4o-mini",
        url="https://openrouter.test/chat",
        timeout=2.0,
        transport=httpx.MockTransport(handler),
    )
    app.dependency_overrides[get_fallback_decider] = lambda: decider


async def uncertain_setup(session_factory):
    """The only 50 unanswered cards: 10 unsure "Pick", 30 unsure "Skip", 5 sure "Music", 5 sure "Sport"."""
    from sqlalchemy import update

    user = uuid7()
    seeded = await seeded_cards(session_factory)
    extra = await add_cards(session_factory, 50)
    names = [f"Pick {i}" for i in range(10)] + [f"Skip {i}" for i in range(30)]
    names += [f"{'Music' if i % 2 else 'Sport'} {i}" for i in range(10)]
    async with session_factory() as session:
        for card, name in zip(extra, names):
            await session.execute(update(Card).where(Card.id == card.id).values(event_name=name))
        await session.commit()
    await answer(session_factory, user, seeded, Decision.RIGHT)
    return user


async def test_low_confidence_cards_are_decided_by_the_fallback_model(session_factory, db_client):
    jev_override(make_jev_client(UncertainJev()))
    router = FakeOpenRouter()
    decider_override(router)
    user = await uncertain_setup(session_factory)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    names = [c["event_name"] for c in response.json()]
    assert len(names) == 10
    # the fallback model's yes cards rank right after Jev's confident yes cards
    assert sum(n.startswith("Music") for n in names) == 5
    assert sum(n.startswith("Pick") for n in names) == 5
    # one call, with only the cards Jev was unsure about, and no user id in it
    assert len(router.bodies) == 1
    sent = json.loads(router.bodies[0]["messages"][1]["content"])["candidates"]
    assert sent and all(not c["event_name"].startswith(("Music", "Sport")) for c in sent)
    assert router.bodies[0]["model"] == "openai/gpt-4o-mini"
    assert router.requests[0].headers["authorization"] == "Bearer or-key"
    assert str(user) not in json.dumps(router.bodies[0])


async def test_confident_jev_does_not_call_the_fallback_model(session_factory, db_client):
    jev_override(make_jev_client(FakeJev()))
    router = FakeOpenRouter()
    decider_override(router)
    user = await history_for(session_factory)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert router.bodies == []


async def test_fallback_failures_keep_jevs_scores(session_factory, db_client):
    jev_override(make_jev_client(UncertainJev()))
    user = await uncertain_setup(session_factory)

    def timeout(request):
        raise httpx.ReadTimeout("slow", request=request)

    broken = {
        "http_500": lambda r: httpx.Response(500, json={"error": "boom"}),
        "invalid_json": lambda r: httpx.Response(200, text="not json"),
        "wrong_shape": lambda r: httpx.Response(
            200, json={"choices": [{"message": {"content": '{"decisions": "yes"}'}}]}
        ),
        "timeout": timeout,
    }
    for name, handler in broken.items():
        decider_override(FakeOpenRouter(reply=handler))
        response = await db_client.get(f"/card/recommendations/{user}")
        assert response.status_code == 200, name
        names = [c["event_name"] for c in response.json()]
        assert len(names) == 10, name
        assert sum(n.startswith("Music") for n in names) == 5, name  # Jev's confident yes cards still lead


async def test_threshold_zero_turns_the_fallback_off(session_factory, db_client, monkeypatch):
    from app.config import get_settings

    monkeypatch.setenv("JEV_MIN_CONFIDENCE", "0")
    get_settings.cache_clear()
    jev_override(make_jev_client(UncertainJev()))
    router = FakeOpenRouter()
    decider_override(router)
    user = await uncertain_setup(session_factory)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert router.bodies == []


async def test_no_openrouter_key_means_no_fallback(monkeypatch):
    from app.config import get_settings
    from app.fallback_decider import get_fallback_decider

    assert get_fallback_decider() is None  # conftest sets OPENROUTER_API_KEY to empty
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-key")
    get_settings.cache_clear()
    assert get_fallback_decider() is not None
