import json

import httpx
import pytest

from app.jev_client import JevClient, JevError
from tests.conftest import make_jev_client


def answers(**values):
    return {"answers": {k: {"type": "noul", "noul": v} for k, v in values.items()}}


async def test_request_shape_and_valid_answers():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json=answers(a=0.9, b=0.1))

    client = make_jev_client(handler)
    scores = await client.score_interest({"candidates": []}, ["a", "b"])

    assert scores == {"a": 0.9, "b": 0.1}
    assert seen["url"] == "https://jev.test/systemone"
    assert seen["auth"] == "Bearer test-key"
    assert seen["body"]["model"] == "jev-test"
    assert seen["body"]["state"] == {"candidates": []}
    assert set(seen["body"]["questions"]) == {"a", "b"}
    assert all(q["type"] == "noul" for q in seen["body"]["questions"].values())
    for question_id, question in seen["body"]["questions"].items():
        assert question_id in question["instructions"]


async def test_invalid_values_and_unknown_ids_are_dropped():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json=answers(a=0.5, b=1.7, c="high", d=True, unknown=0.9)
        )

    client = make_jev_client(handler)
    assert await client.score_interest({}, ["a", "b", "c", "d"]) == {"a": 0.5}


@pytest.mark.parametrize(
    "handler",
    [
        lambda request: httpx.Response(500, json={"error": "boom"}),
        lambda request: httpx.Response(200, text="not json"),
        lambda request: httpx.Response(200, json={"unexpected": 1}),
    ],
    ids=["http_500", "invalid_json", "missing_answers"],
)
async def test_failures_raise_jev_error(handler):
    with pytest.raises(JevError):
        await make_jev_client(handler).score_interest({}, ["a"])


async def test_timeout_raises_jev_error():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(JevError):
        await make_jev_client(handler).score_interest({}, ["a"])


async def test_missing_api_key_raises_jev_error():
    client = JevClient(api_key=None, model="m", url="https://jev.test", timeout=1.0)
    with pytest.raises(JevError):
        await client.score_interest({}, ["a"])


async def test_error_messages_never_contain_the_key():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "bad key test-key"})

    with pytest.raises(JevError) as info:
        await make_jev_client(handler).score_interest({"secret": "state"}, ["a"])
    assert "test-key" not in str(info.value)
    assert "secret" not in str(info.value)
