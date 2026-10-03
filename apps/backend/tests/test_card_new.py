import asyncio

import pytest
from uuid6 import uuid7

from app.seed import SEED_CARDS, STARTER_CARDS
from tests.conftest import make_client, make_database

CARD_FIELDS = {
    "id", "event_name", "color_code", "description", "image_url",
    "starts_at", "ends_at", "address", "lat", "lng", "price",
}
STARTER_IDS = [str(card.id) for card in STARTER_CARDS]


async def fetch(client, user_id):
    return await client.get(f"/card/new/{user_id}")


async def test_cards_come_in_order_then_no_more(db_client):
    user = uuid7()
    cards = []
    for _ in range(6):
        response = await fetch(db_client, user)
        assert response.status_code == 200
        assert set(response.json()) == CARD_FIELDS
        cards.append(response.json())
    assert [c["id"] for c in cards] == STARTER_IDS

    for _ in range(2):
        response = await fetch(db_client, user)
        assert response.status_code == 404
        assert response.json() == {"detail": "No more cards"}


async def test_card_times_keep_their_timezone(db_client):
    from datetime import datetime, timezone

    body = (await fetch(db_client, uuid7())).json()
    starts_at = datetime.fromisoformat(body["starts_at"])
    assert starts_at.tzinfo is not None
    assert starts_at == datetime(2026, 10, 9, 22, 0, tzinfo=timezone.utc)  # 2026-10-10T00:00+02:00
    assert body["ends_at"] is None


async def test_invalid_user_id_is_rejected(db_client):
    response = await db_client.get("/card/new/not-a-uuid")
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


async def test_progress_is_per_user(db_client):
    user_a, user_b = uuid7(), uuid7()
    for _ in range(2):
        await fetch(db_client, user_a)
    assert (await fetch(db_client, user_b)).json()["id"] == STARTER_IDS[0]
    assert (await fetch(db_client, user_a)).json()["id"] == STARTER_IDS[2]


async def test_concurrent_requests_never_repeat_or_skip(db_client):
    user = uuid7()
    responses = await asyncio.gather(*(fetch(db_client, user) for _ in range(6)))
    assert all(r.status_code == 200 for r in responses)
    assert sorted(r.json()["id"] for r in responses) == sorted(STARTER_IDS)
    assert (await fetch(db_client, user)).status_code == 404


async def test_progress_survives_restart(db_path):
    user = uuid7()
    engine, factory = await make_database(db_path)
    async with make_client(factory) as client:
        await fetch(client, user)
        await fetch(client, user)
    await engine.dispose()

    engine, factory = await make_database(db_path)
    async with make_client(factory) as client:
        response = await fetch(client, user)
    await engine.dispose()
    assert response.json()["id"] == STARTER_IDS[2]


async def test_seeding_is_idempotent_and_keeps_edits(session_factory):
    from sqlalchemy import func, select

    from app.models import Card
    from app.seed import seed_cards

    async with session_factory() as session:
        card = await session.get(Card, SEED_CARDS[0].id)
        card.event_name = "Edited"
        await session.commit()
        assert await seed_cards(session) == 0
        count = await session.scalar(select(func.count()).select_from(Card))
        assert count == len(SEED_CARDS)
        assert (await session.get(Card, SEED_CARDS[0].id)).event_name == "Edited"


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    from app.main import app

    app.dependency_overrides.clear()
