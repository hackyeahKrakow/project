import json
import time

import httpx
import pytest
from uuid6 import uuid7

from app.config import Settings
from app.jev_client import JevClient, JevError, get_jev_client
from app.models import Decision
from app.monitoring import TracedJevClient, build_tracing_client
from tests.conftest import jev_override, make_jev_client
from tests.monitoring_helpers import (
    PRIVATE_CHOICE,
    QUESTION_IDS,
    STATE,
    FakeLangSmithSession,
    StubLangSmith,
    captured_traces,
    jev_scores,
    traced_client,
)
from tests.test_recommendations import answer, seeded_cards

SCORES = {"C1": 0.9, "C2": 0.2}


def _by_position(request: httpx.Request) -> httpx.Response:
    """Scores every asked card by its place among the asked ids, so both clients agree exactly."""
    ids = sorted(json.loads(request.content)["questions"])
    return httpx.Response(200, json={"answers": {i: {"type": "noul", "noul": n / 100} for n, i in enumerate(ids)}})


def _plain(handler) -> JevClient:
    return make_jev_client(handler)


async def test_same_result_with_and_without_monitoring():
    plain = await _plain(jev_scores(SCORES)).score_interest(STATE, QUESTION_IDS)
    traced = await traced_client(jev_scores(SCORES), FakeLangSmithSession()).score_interest(STATE, QUESTION_IDS)

    assert traced == plain == SCORES


async def test_same_recommendations_with_and_without_monitoring(db_client, session_factory):
    user = uuid7()
    await answer(session_factory, user, (await seeded_cards(session_factory))[:3], Decision.RIGHT)

    jev_override(_plain(_by_position))
    plain = (await db_client.get(f"/card/recommendations/{user}")).json()
    jev_override(traced_client(_by_position, FakeLangSmithSession()))
    traced = (await db_client.get(f"/card/recommendations/{user}")).json()

    assert [c["id"] for c in traced] == [c["id"] for c in plain]
    assert len(traced) == 10


async def test_broken_monitoring_does_not_affect_the_call():
    down = FakeLangSmithSession()
    down.down = True
    plain_client = _plain(jev_scores(SCORES))
    traced = traced_client(jev_scores(SCORES), down)

    started = time.perf_counter()
    await plain_client.score_interest(STATE, QUESTION_IDS)
    plain_time = time.perf_counter() - started
    started = time.perf_counter()
    result = await traced.score_interest(STATE, QUESTION_IDS)
    traced_time = time.perf_counter() - started

    assert result == SCORES
    assert traced_time - plain_time < 0.1

    failing = traced_client(lambda request: httpx.Response(500, json={}), down)
    with pytest.raises(JevError, match="http_500"):  # the Jev error is still the one the caller gets
        await failing.score_interest(STATE, QUESTION_IDS)


@pytest.mark.parametrize("odd_state", [{}, {"candidates": [], "disliked": []}, {"liked": "not a list"}])
async def test_odd_states_behave_like_the_plain_client(odd_state):
    plain = await _plain(jev_scores({"C1": 0.9})).score_interest(odd_state, ["C1"])

    traced = await traced_client(jev_scores({"C1": 0.9}), FakeLangSmithSession()).score_interest(odd_state, ["C1"])

    assert traced == plain == {"C1": 0.9}


@pytest.mark.parametrize("mode", ["ok", "forbidden", "slow"])
async def test_slow_or_rejecting_langsmith_does_not_slow_the_call(mode):
    """The production client config (background upload) against a LangSmith that is fine, rejects the key, or is slow."""
    candidates = [
        {"id": f"C{i}", "event_name": f"Event {i}", "description": "x" * 150, "price": 25.0, "address": "ul. Długa 12"}
        for i in range(50)
    ]
    state = {"liked": [], "disliked": [], "candidates": candidates}
    ids = [c["id"] for c in candidates]
    handler = jev_scores({i: 0.5 for i in ids})
    stub = StubLangSmith(mode)
    client = build_tracing_client("ls-test-key", stub.url)
    plain = _plain(handler)
    traced = TracedJevClient(
        api_key="test-key", model="jev-test", url="https://jev.test/systemone", timeout=2.0,
        transport=httpx.MockTransport(handler), tracing_client=client, environment="dev",
    )

    async def average_seconds(jev) -> float:
        started = time.perf_counter()
        for _ in range(20):
            assert await jev.score_interest(state, ids) == {i: 0.5 for i in ids}  # always the plain result
        return (time.perf_counter() - started) / 20

    try:
        extra = await average_seconds(traced) - await average_seconds(plain)
    finally:
        client.cleanup()
        stub.close()

    assert extra < 0.1


def test_off_without_a_key(monkeypatch):
    without_key = Settings(_env_file=None, langsmith_api_key=None)  # None beats an env var of the same name
    monkeypatch.setattr("app.jev_client.get_settings", lambda: without_key)
    assert type(get_jev_client()) is JevClient

    with_key = Settings(_env_file=None, langsmith_api_key="ls-test-key")
    monkeypatch.setattr("app.jev_client.get_settings", lambda: with_key)
    monkeypatch.setattr("app.monitoring.get_tracing_client", lambda: object())  # no real client, no network
    assert type(get_jev_client()) is TracedJevClient


def test_empty_key_means_off(monkeypatch):
    # what copying .env.example gives: LANGSMITH_API_KEY= with nothing after it
    monkeypatch.setattr("app.jev_client.get_settings", lambda: Settings(_env_file=None, langsmith_api_key=""))

    assert type(get_jev_client()) is JevClient


async def test_missing_run_tree_is_harmless(monkeypatch):
    monkeypatch.setattr("app.monitoring.get_current_run_tree", lambda: None)  # what tracing off looks like

    result = await traced_client(jev_scores(SCORES), FakeLangSmithSession()).score_interest(STATE, QUESTION_IDS)

    assert result == SCORES


async def test_failing_metadata_update_is_harmless(monkeypatch):
    class BrokenRun:
        def add_metadata(self, metadata):
            raise RuntimeError("tracing is broken")

    monkeypatch.setattr("app.monitoring.get_current_run_tree", lambda: BrokenRun())

    ok = await traced_client(jev_scores(SCORES), FakeLangSmithSession()).score_interest(STATE, QUESTION_IDS)
    assert ok == SCORES
    with pytest.raises(JevError, match="http_500"):  # the Jev error is still the one the caller gets
        await traced_client(lambda request: httpx.Response(500, json={}), FakeLangSmithSession()).score_interest(
            STATE, QUESTION_IDS
        )


async def test_unexpected_error_text_is_not_stored(monkeypatch):
    async def explode(self, state, question_ids):
        raise RuntimeError(f"bad value in {state['choices']}")  # an error that quotes the saved choices

    monkeypatch.setattr("app.jev_client.JevClient.score_interest", explode)
    session = FakeLangSmithSession()

    with pytest.raises(RuntimeError, match=PRIVATE_CHOICE):  # the caller still gets the very same error
        await traced_client(jev_scores({}), session).score_interest(STATE, QUESTION_IDS)

    assert PRIVATE_CHOICE not in session.everything_sent()
    [trace] = captured_traces(session)
    assert trace["error"].startswith("RuntimeError")
    assert "bad value" not in trace["error"]  # only the class name is kept


async def test_a_jev_error_still_shows_its_reason_in_the_trace():
    session = FakeLangSmithSession()

    with pytest.raises(JevError, match="http_500"):
        await traced_client(lambda request: httpx.Response(500, json={}), session).score_interest(STATE, QUESTION_IDS)

    [trace] = captured_traces(session)
    assert "JevError('http_500')" in trace["error"]  # a safe reason code, so it stays readable


def test_factory_survives_a_broken_tracing_client(monkeypatch):
    def broken():
        raise RuntimeError("cannot build the client")

    monkeypatch.setattr("app.jev_client.get_settings", lambda: Settings(_env_file=None, langsmith_api_key="ls-test-key"))
    monkeypatch.setattr("app.monitoring.get_tracing_client", broken)

    assert type(get_jev_client()) is JevClient
