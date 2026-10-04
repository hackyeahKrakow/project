import json
from datetime import date

import httpx
import pytest

from app.event_parser import EventParser, get_event_parser
from app.main import app

POST = "Wieczór planszówek w Kawiarni Kości! W czwartek o 19:00 przy Krupniczej 5. Wstęp wolny."


def make_parser(handler) -> EventParser:
    return EventParser("test-key", "chat-test", "https://zen.test/chat", 2.0, httpx.MockTransport(handler))


def reply(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


async def test_draft_from_fenced_json_with_uncertain_and_naive_dates():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        data = {
            "title": "Wieczór planszówek",
            "category": "gry",
            "starts_at": "2026-10-08T19:00:00",
            "address": "ul. Krupnicza 5, Kraków",
            "price": 0,
            "size": "huge",
            "uncertain_fields": ["address"],
        }
        return reply(f"Oto dane:\n```json\n{json.dumps(data)}\n```")

    draft = await make_parser(handler).parse(POST, date(2026, 10, 3))

    assert seen["auth"] == "Bearer test-key"
    assert seen["body"]["model"] == "chat-test"
    assert "sobota, 2026-10-03" in seen["body"]["messages"][0]["content"]
    assert seen["body"]["messages"][1]["content"] == POST
    assert draft.title == "Wieczór planszówek"
    assert draft.price == 0
    assert draft.starts_at.isoformat() == "2026-10-08T19:00:00+02:00"
    assert draft.size is None  # invalid value dropped, not fatal
    assert set(draft.missing_fields) == {"description", "ends_at", "address", "size"}


async def test_invalid_json_twice_returns_empty_draft():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(1)
        return reply("nie wiem")

    draft = await make_parser(handler).parse(POST, date(2026, 10, 3))
    assert len(calls) == 2
    assert draft.title is None and len(draft.missing_fields) == 8


@pytest.mark.parametrize("status_code", [401, 500])
async def test_endpoint_returns_503_when_ai_fails(status_code):
    parser = make_parser(lambda request: httpx.Response(status_code))
    app.dependency_overrides[get_event_parser] = lambda: parser
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/events/parse", json={"text": POST})
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 503
    assert res.json() == {"detail": "AI unavailable"}


async def test_endpoint_without_key_is_503_and_short_text_is_422():
    app.dependency_overrides[get_event_parser] = lambda: EventParser(None, "m", "https://zen.test", 1.0)
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.post("/events/parse", json={"text": POST})).status_code == 503
            assert (await client.post("/events/parse", json={"text": "krótko"})).status_code == 422
    finally:
        app.dependency_overrides.clear()
