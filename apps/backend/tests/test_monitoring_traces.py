import httpx
import pytest
from uuid6 import uuid7

from app.jev_client import JevError
from tests.conftest import jev_override
from tests.monitoring_helpers import (
    PRIVATE_CHOICE,
    QUESTION_IDS,
    STATE,
    FakeLangSmithSession,
    captured_traces,
    jev_scores,
    traced_client,
)
from tests.test_recommendations import answer, seeded_cards
from app.models import Decision

SCORES = {"C1": 0.9, "C2": 0.2}


async def test_success_trace():
    session = FakeLangSmithSession()
    client = traced_client(jev_scores(SCORES), session)

    result = await client.score_interest(STATE, QUESTION_IDS)

    assert result == SCORES
    [trace] = captured_traces(session)
    assert trace["name"] == "jev.score_interest"
    assert trace["project"] == "spotted-jev"
    assert trace["outputs"] == {"scores": SCORES}
    metadata = trace["metadata"]
    assert metadata["outcome"] == "success"
    assert metadata["model"] == "jev-test"
    assert (metadata["candidates"], metadata["liked"], metadata["disliked"]) == (2, 1, 1)
    assert metadata["has_choices"] is True


def _timeout(request):
    raise httpx.ReadTimeout("slow", request=request)


def _network(request):
    raise httpx.ConnectError("down", request=request)


@pytest.mark.parametrize(
    ("handler", "reason"),
    [
        (_timeout, "timeout"),
        (lambda request: httpx.Response(401, json={}), "http_401"),
        (_network, "network_error"),
        (lambda request: httpx.Response(200, json={"nope": 1}), "invalid_response"),
    ],
)
async def test_failure_trace(handler, reason):
    session = FakeLangSmithSession()
    client = traced_client(handler, session)

    with pytest.raises(JevError) as raised:
        await client.score_interest(STATE, QUESTION_IDS)

    assert str(raised.value) == reason  # the caller sees the same error as without monitoring
    [trace] = captured_traces(session)
    assert trace["metadata"]["outcome"] == "failed"
    assert trace["metadata"]["reason"] == reason
    assert trace["error"]


async def test_inputs_are_redacted():
    session = FakeLangSmithSession()
    client = traced_client(jev_scores(SCORES), session)

    await client.score_interest(STATE, QUESTION_IDS)

    body = session.everything_sent()
    assert PRIVATE_CHOICE not in body
    assert "ul. Tajna" not in body
    assert "test-key" not in body  # the Jev key
    [trace] = captured_traces(session)
    inputs = trace["inputs"]
    assert inputs["choices_included"] is True
    assert inputs["candidates"] == STATE["candidates"]  # names and descriptions are allowed
    assert inputs["liked"] == [{"id": "L1", "event_name": "Korn"}]
    assert inputs["disliked"] == [{"id": "D1", "event_name": "Spacer"}]
    assert inputs["questions"] == 2


async def test_one_trace_per_jev_call_and_none_for_cold_start(db_client, session_factory):
    session = FakeLangSmithSession()

    def scores_for_everything(request: httpx.Request) -> httpx.Response:
        import json

        ids = json.loads(request.content)["questions"]
        return httpx.Response(200, json={"answers": {i: {"type": "noul", "noul": 0.5} for i in ids}})

    jev_override(traced_client(scores_for_everything, session))
    user_with_swipes, new_user = uuid7(), uuid7()
    await answer(session_factory, user_with_swipes, (await seeded_cards(session_factory))[:2], Decision.RIGHT)

    assert (await db_client.get(f"/card/recommendations/{new_user}")).status_code == 200
    assert captured_traces(session) == []  # no answers and no choices: Jev was not asked

    assert (await db_client.get(f"/card/recommendations/{user_with_swipes}")).status_code == 200
    assert len(captured_traces(session)) == 1
