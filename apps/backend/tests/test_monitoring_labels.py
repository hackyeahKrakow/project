import httpx
import pytest

from app.jev_client import JevError
from tests.monitoring_helpers import (
    QUESTION_IDS,
    STATE,
    FakeLangSmithSession,
    captured_traces,
    jev_scores,
    traced_client,
)


async def test_environment_tag():
    production, default = FakeLangSmithSession(), FakeLangSmithSession()

    await traced_client(jev_scores({"C1": 0.5}), production, environment="production").score_interest(STATE, QUESTION_IDS)
    await traced_client(jev_scores({"C1": 0.5}), default).score_interest(STATE, QUESTION_IDS)

    assert [t["tags"] for t in captured_traces(production)] == [["production"]]
    assert [t["tags"] for t in captured_traces(default)] == [["dev"]]


def _timeout(request):
    raise httpx.ReadTimeout("slow", request=request)


def _network(request):
    raise httpx.ConnectError("down", request=request)


@pytest.mark.parametrize(
    ("handler", "reason", "api_key"),
    [
        (lambda request: httpx.Response(200, json={}), "missing_api_key", None),
        (_timeout, "timeout", "test-key"),
        (lambda request: httpx.Response(500, json={}), "http_500", "test-key"),
        (_network, "network_error", "test-key"),
        (lambda request: httpx.Response(200, json={"nope": 1}), "invalid_response", "test-key"),
    ],
)
async def test_reason_codes_are_the_documented_ones(handler, reason, api_key):
    session = FakeLangSmithSession()
    client = traced_client(handler, session)
    client._api_key = api_key  # `missing_api_key` is what the plain client raises without a key

    with pytest.raises(JevError, match=reason):
        await client.score_interest(STATE, QUESTION_IDS)

    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "failed"
    assert trace["metadata"]["reason"] == reason


async def test_a_successful_run_has_no_reason():
    session = FakeLangSmithSession()

    await traced_client(jev_scores({"C1": 0.5}), session).score_interest(STATE, QUESTION_IDS)

    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "success"
    assert "reason" not in trace["metadata"]


async def test_an_unexpected_error_is_labelled_as_a_failure(monkeypatch):
    async def explode(self, state, question_ids):
        raise RuntimeError("something else broke: secret detail")

    monkeypatch.setattr("app.jev_client.JevClient.score_interest", explode)
    session = FakeLangSmithSession()

    with pytest.raises(RuntimeError, match="something else broke"):  # the caller gets the very same error
        await traced_client(jev_scores({}), session).score_interest(STATE, QUESTION_IDS)

    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "failed"
    assert trace["metadata"]["reason"] == "unexpected_error"  # a fixed text, never the exception's own
