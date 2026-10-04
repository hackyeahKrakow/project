import json
import time

import httpx
import pytest
from uuid6 import uuid7

from app.config import Settings
from app.jev_client import JevClient, JevError, get_jev_client
from app.models import Decision
from app.monitoring import TracedJevClient
from tests.conftest import jev_override, make_jev_client
from tests.monitoring_helpers import (
    QUESTION_IDS,
    STATE,
    FakeLangSmithSession,
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


def test_off_without_a_key(monkeypatch):
    monkeypatch.setattr("app.jev_client.get_settings", lambda: Settings(_env_file=None))
    assert type(get_jev_client()) is JevClient

    with_key = Settings(_env_file=None, langsmith_api_key="ls-test-key")
    monkeypatch.setattr("app.jev_client.get_settings", lambda: with_key)
    monkeypatch.setattr("app.monitoring.get_tracing_client", lambda: object())  # no real client, no network
    assert type(get_jev_client()) is TracedJevClient


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


def test_factory_survives_a_broken_tracing_client(monkeypatch):
    def broken():
        raise RuntimeError("cannot build the client")

    monkeypatch.setattr("app.jev_client.get_settings", lambda: Settings(_env_file=None, langsmith_api_key="ls-test-key"))
    monkeypatch.setattr("app.monitoring.get_tracing_client", broken)

    assert type(get_jev_client()) is JevClient
