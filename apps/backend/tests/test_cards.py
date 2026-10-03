import httpx
import pytest
from uuid6 import uuid7

from app.main import app


@pytest.fixture
async def client():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


async def test_card_fetch_is_not_implemented(client):
    assert (await client.get(f"/card/{uuid7()}")).status_code == 501


async def test_card_fetch_rejects_invalid_user_id(client):
    assert (await client.get("/card/not-a-uuid")).status_code == 422


async def test_card_response_is_not_implemented(client):
    body = {"card_id": str(uuid7()), "decision": "right"}
    assert (await client.post(f"/card/{uuid7()}", json=body)).status_code == 501


async def test_card_response_rejects_unknown_decision(client):
    body = {"card_id": str(uuid7()), "decision": "up"}
    assert (await client.post(f"/card/{uuid7()}", json=body)).status_code == 422


async def test_card_response_rejects_non_uuid7_card_id(client):
    body = {"card_id": "123", "decision": "left"}
    assert (await client.post(f"/card/{uuid7()}", json=body)).status_code == 422


async def test_validation_errors_use_error_response_shape(client):
    response = await client.get("/card/not-a-uuid")
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
