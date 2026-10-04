"""LangSmith traces of the fallback model (`fallback.decide`), with the same guarantees as the Jev traces."""

import json
import time

import httpx
import pytest
from uuid6 import uuid7

from app.config import Settings
from app.fallback_decider import FallbackDecider, FallbackError, get_fallback_decider
from app.main import app
from app.models import Decision
from app.monitoring import TracedFallbackDecider, build_tracing_client
from tests.conftest import add_cards, jev_override
from tests.monitoring_helpers import (
    PRIVATE_CHOICE,
    ROUTING,
    STATE,
    FakeLangSmithSession,
    StubLangSmith,
    captured_traces,
    decisions_by_position,
    traced_client,
    traced_decider,
)
from tests.test_recommendations import answer

DECISIONS = {"C1": True, "C2": False}


def _plain(handler) -> FallbackDecider:
    return FallbackDecider("di-test-key", "fallback-test", "https://deepinfra.test/chat", 2.0,
                           reasoning_effort="none", transport=httpx.MockTransport(handler))


def _timeout(request):
    raise httpx.ReadTimeout("slow", request=request)


def _network(request):
    raise httpx.ConnectError("down", request=request)


def _content(text):
    return lambda request: httpx.Response(200, json={"choices": [{"message": {"content": text}}]})


async def test_success_trace():
    session = FakeLangSmithSession()

    result = await traced_decider(decisions_by_position(True, False), session).decide(STATE, ROUTING)

    assert result == DECISIONS
    [trace] = captured_traces(session)
    assert trace["name"] == "fallback.decide"
    assert trace["project"] == "spotted-jev"
    assert trace["outputs"] == {"decisions": DECISIONS}
    metadata = trace["metadata"]
    assert metadata["outcome"] == "success"
    assert "reason" not in metadata
    assert metadata["model"] == "fallback-test"
    assert metadata["reasoning_effort"] == "none"
    assert (metadata["candidates"], metadata["liked"], metadata["disliked"]) == (2, 1, 1)
    assert metadata["has_choices"] is True
    assert (metadata["decided"], metadata["yes"]) == (2, 1)
    assert metadata["routing_candidates_total"] == 10
    assert metadata["routing_scored_by_jev"] == 10
    assert metadata["routing_uncertain_share"] == 0.2
    assert metadata["routing_min_confidence"] == 0.2


async def test_a_model_that_skips_cards_shows_in_decided():
    session = FakeLangSmithSession()

    result = await traced_decider(decisions_by_position(True), session).decide(STATE, ROUTING)

    assert result == {"C1": True}
    [trace] = captured_traces(session)
    assert (trace["metadata"]["candidates"], trace["metadata"]["decided"]) == (2, 1)


async def test_without_routing_and_with_default_reasoning():
    session = FakeLangSmithSession()

    result = await traced_decider(decisions_by_position(True, False), session, reasoning_effort=None).decide(STATE)

    assert result == DECISIONS
    [trace] = captured_traces(session)
    assert trace["metadata"]["reasoning_effort"] == "default"
    assert not any(key.startswith("routing_") for key in trace["metadata"])


@pytest.mark.parametrize(
    ("handler", "reason"),
    [
        (_timeout, "timeout"),
        (lambda request: httpx.Response(401, json={}), "http_401"),
        (_network, "network_error"),
        (lambda request: httpx.Response(200, json={"nope": 1}), "invalid_response"),
        (_content("not json at all"), "invalid_response"),
        (_content(None), "invalid_response"),  # a thinking model that used up max_tokens
        (_content('{"decisions": {"1": tr'), "invalid_response"),  # JSON cut off in the middle
    ],
    ids=["timeout", "http_401", "network", "bad_shape", "no_json", "null_content", "truncated"],
)
async def test_failure_trace(handler, reason):
    session = FakeLangSmithSession()

    with pytest.raises(FallbackError) as raised:
        await traced_decider(handler, session).decide(STATE, ROUTING)

    assert str(raised.value) == reason  # the caller sees the same error as without monitoring
    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "failed"
    assert trace["metadata"]["reason"] == reason
    assert f"FallbackError('{reason}')" in trace["error"]  # a safe reason code, so it stays readable
    assert not trace["outputs"]  # a failed run has no decisions


async def test_inputs_are_redacted_and_show_real_card_ids():
    session = FakeLangSmithSession()

    await traced_decider(decisions_by_position(True, False), session).decide(STATE, ROUTING)

    body = session.everything_sent()
    for secret in (PRIVATE_CHOICE, "ul. Tajna", "di-test-key", "ls-test-key"):
        assert secret not in body
    [trace] = captured_traces(session)
    inputs = trace["inputs"]
    assert inputs["choices_included"] is True
    assert inputs["candidates"] == STATE["candidates"]  # the card ids, not the short keys the model sees
    assert inputs["liked"] == [{"id": "L1", "event_name": "Korn"}]
    assert inputs["disliked"] == [{"id": "D1", "event_name": "Spacer"}]
    assert inputs["model"] == "fallback-test"
    assert inputs["routing"] == ROUTING


@pytest.mark.parametrize("odd_state", [{"candidates": []}, {"candidates": [{"id": "C1"}]}])
async def test_odd_states_never_leak_and_never_break_the_call(odd_state):
    session = FakeLangSmithSession()
    plain = await _plain(decisions_by_position(True)).decide(odd_state)

    traced = await traced_decider(decisions_by_position(True), session).decide(odd_state, ROUTING)

    assert traced == plain
    [trace] = captured_traces(session)
    assert trace["inputs"] == {"redaction": "failed"}  # a fixed placeholder, never the raw inputs


async def test_same_result_with_and_without_monitoring():
    plain = await _plain(decisions_by_position(True, False)).decide(STATE, ROUTING)
    traced = await traced_decider(decisions_by_position(True, False), FakeLangSmithSession()).decide(STATE, ROUTING)

    assert traced == plain == DECISIONS


async def test_environment_tag():
    production, default = FakeLangSmithSession(), FakeLangSmithSession()

    await traced_decider(decisions_by_position(True, False), production, environment="production").decide(STATE)
    await traced_decider(decisions_by_position(True, False), default).decide(STATE)

    assert [t["tags"] for t in captured_traces(production)] == [["production"]]
    assert [t["tags"] for t in captured_traces(default)] == [["dev"]]


async def test_broken_monitoring_does_not_affect_the_call():
    down = FakeLangSmithSession()
    down.down = True

    started = time.perf_counter()
    result = await traced_decider(decisions_by_position(True, False), down).decide(STATE, ROUTING)
    elapsed = time.perf_counter() - started

    assert result == DECISIONS
    assert elapsed < 1
    with pytest.raises(FallbackError, match="http_500"):  # the error is still the one the caller gets
        await traced_decider(lambda request: httpx.Response(500, json={}), down).decide(STATE, ROUTING)


@pytest.mark.parametrize("mode", ["ok", "forbidden", "slow"])
async def test_slow_or_rejecting_langsmith_does_not_slow_the_call(mode):
    """The production client config (background upload) against a LangSmith that is fine, rejects the key, or is slow."""
    candidates = [
        {"id": f"C{i}", "event_name": f"Event {i}", "description": "x" * 150, "price": 25.0, "address": "ul. Długa 12"}
        for i in range(50)
    ]
    state = {"liked": [], "disliked": [], "candidates": candidates}
    answers = decisions_by_position(*([True] * 50))
    expected = {c["id"]: True for c in candidates}
    stub = StubLangSmith(mode)
    client = build_tracing_client("ls-test-key", stub.url)
    plain = _plain(answers)
    traced = TracedFallbackDecider(
        api_key="di-test-key", model="fallback-test", url="https://deepinfra.test/chat", timeout=2.0,
        reasoning_effort="none", transport=httpx.MockTransport(answers), tracing_client=client, environment="dev",
    )

    async def average_seconds(decider) -> float:
        started = time.perf_counter()
        for _ in range(20):
            assert await decider.decide(state, ROUTING) == expected  # always the plain result
        return (time.perf_counter() - started) / 20

    try:
        extra = await average_seconds(traced) - await average_seconds(plain)
    finally:
        client.cleanup()
        stub.close()

    assert extra < 0.1


async def test_missing_run_tree_is_harmless(monkeypatch):
    monkeypatch.setattr("app.monitoring.get_current_run_tree", lambda: None)  # what tracing off looks like

    result = await traced_decider(decisions_by_position(True, False), FakeLangSmithSession()).decide(STATE, ROUTING)

    assert result == DECISIONS


async def test_failing_metadata_update_is_harmless(monkeypatch):
    class BrokenRun:
        def add_metadata(self, metadata):
            raise RuntimeError("tracing is broken")

    monkeypatch.setattr("app.monitoring.get_current_run_tree", lambda: BrokenRun())

    ok = await traced_decider(decisions_by_position(True, False), FakeLangSmithSession()).decide(STATE, ROUTING)
    assert ok == DECISIONS
    with pytest.raises(FallbackError, match="http_500"):
        await traced_decider(lambda request: httpx.Response(500, json={}), FakeLangSmithSession()).decide(STATE, ROUTING)


async def test_an_unexpected_error_is_labelled_and_its_text_is_not_stored(monkeypatch):
    async def explode(self, state, routing=None):
        raise RuntimeError(f"bad value in {state['choices']}")  # an error that quotes the saved choices

    monkeypatch.setattr("app.fallback_decider.FallbackDecider.decide", explode)
    session = FakeLangSmithSession()

    with pytest.raises(RuntimeError, match=PRIVATE_CHOICE):  # the caller still gets the very same error
        await traced_decider(decisions_by_position(), session).decide(STATE, ROUTING)

    assert PRIVATE_CHOICE not in session.everything_sent()
    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "failed"
    assert trace["metadata"]["reason"] == "unexpected_error"  # a fixed text, never the exception's own
    assert trace["error"].startswith("RuntimeError")
    assert "bad value" not in trace["error"]  # only the class name is kept


# --- the factory: on only with a LangSmith key, like the Jev client ---


def _settings(**values) -> Settings:
    return Settings(_env_file=None, deepinfra_api_key="di-test-key", **values)


def test_factory_is_traced_only_with_a_langsmith_key(monkeypatch):
    monkeypatch.setattr("app.fallback_decider.get_settings", lambda: _settings(langsmith_api_key=None))
    assert type(get_fallback_decider()) is FallbackDecider

    monkeypatch.setattr("app.fallback_decider.get_settings", lambda: _settings(langsmith_api_key=""))
    assert type(get_fallback_decider()) is FallbackDecider  # what copying .env.example gives

    monkeypatch.setattr("app.fallback_decider.get_settings", lambda: _settings(langsmith_api_key="ls-test-key"))
    monkeypatch.setattr("app.monitoring.get_tracing_client", lambda: object())  # no real client, no network
    assert type(get_fallback_decider()) is TracedFallbackDecider


def test_factory_without_a_deepinfra_key_is_none_even_with_monitoring(monkeypatch):
    settings = Settings(_env_file=None, deepinfra_api_key=None, langsmith_api_key="ls-test-key")
    monkeypatch.setattr("app.fallback_decider.get_settings", lambda: settings)

    assert get_fallback_decider() is None


def test_factory_survives_a_broken_tracing_client(monkeypatch):
    def broken():
        raise RuntimeError("cannot build the client")

    monkeypatch.setattr("app.fallback_decider.get_settings", lambda: _settings(langsmith_api_key="ls-test-key"))
    monkeypatch.setattr("app.monitoring.get_tracing_client", broken)

    assert type(get_fallback_decider()) is FallbackDecider


# --- through the endpoint: one Jev trace, plus one fallback trace only when Jev is unsure ---


def _jev_says(probability: float):
    def handler(request: httpx.Request) -> httpx.Response:
        ids = json.loads(request.content)["questions"]
        return httpx.Response(200, json={"answers": {i: {"type": "noul", "noul": probability} for i in ids}})

    return handler


def _everything_yes(request: httpx.Request) -> httpx.Response:
    state = json.loads(json.loads(request.content)["messages"][1]["content"])
    content = json.dumps({"decisions": {c["id"]: True for c in state["candidates"]}})
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


async def _user_with_history(session_factory):
    user = uuid7()
    extra = await add_cards(session_factory, 60)
    await answer(session_factory, user, extra[:2], Decision.RIGHT)
    return user


async def test_unsure_jev_gives_a_jev_trace_and_a_fallback_trace(db_client, session_factory):
    session = FakeLangSmithSession()
    jev_override(traced_client(_jev_says(0.55), session))
    decider = traced_decider(_everything_yes, session)
    app.dependency_overrides[get_fallback_decider] = lambda: decider
    user = await _user_with_history(session_factory)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 10
    jev_trace, fallback_trace = captured_traces(session)
    assert (jev_trace["name"], fallback_trace["name"]) == ("jev.score_interest", "fallback.decide")
    metadata = fallback_trace["metadata"]
    assert metadata["outcome"] == "success"
    assert metadata["candidates"] == metadata["routing_candidates_total"] == 50  # 0.55 is unsure for every card
    assert metadata["routing_scored_by_jev"] == 50
    assert metadata["routing_uncertain_share"] == 1.0
    assert (metadata["decided"], metadata["yes"]) == (50, 50)
    assert str(user) not in session.everything_sent()


async def test_confident_jev_gives_no_fallback_trace(db_client, session_factory):
    session = FakeLangSmithSession()
    jev_override(traced_client(_jev_says(0.9), session))
    app.dependency_overrides[get_fallback_decider] = lambda: traced_decider(_everything_yes, session)
    user = await _user_with_history(session_factory)

    assert (await db_client.get(f"/card/recommendations/{user}")).status_code == 200

    assert [t["name"] for t in captured_traces(session)] == ["jev.score_interest"]


async def test_failed_fallback_still_gives_ten_cards_and_a_failed_trace(db_client, session_factory):
    session = FakeLangSmithSession()
    jev_override(traced_client(_jev_says(0.55), session))
    app.dependency_overrides[get_fallback_decider] = lambda: traced_decider(
        lambda request: httpx.Response(500, json={}), session
    )
    user = await _user_with_history(session_factory)

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    assert len(response.json()) == 10  # Jev's own scores decide
    jev_trace, fallback_trace = captured_traces(session)
    assert jev_trace["metadata"]["outcome"] == "success"
    assert fallback_trace["metadata"]["outcome"] == "failed"
    assert fallback_trace["metadata"]["reason"] == "http_500"

