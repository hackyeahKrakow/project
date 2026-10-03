from datetime import datetime, timezone

from uuid6 import uuid7

from app.models import Card, Decision
from tests.conftest import jev_override, make_jev_client
from tests.test_recommendations import FakeJev, answer, seeded_cards


async def test_card_without_coordinates_and_price_is_stored_and_served(session_factory, db_client):
    jev_override(make_jev_client(FakeJev()))
    user = uuid7()
    await answer(session_factory, user, await seeded_cards(session_factory), Decision.LEFT)
    card = Card(
        id=uuid7(),
        event_name="Music with unknown details",
        color_code="#7C3AED",
        description="Address known, coordinates and price not yet.",
        image_url=None,
        starts_at=datetime(2026, 12, 1, 18, 0, tzinfo=timezone.utc),
        ends_at=None,
        address="Klub Studio, ul. Budryka 4, Kraków",
        lat=None,
        lng=None,
        price=None,
    )
    async with session_factory() as session:
        session.add(card)
        await session.commit()

    response = await db_client.get(f"/card/recommendations/{user}")

    assert response.status_code == 200
    # the user answered every seeded card, so the new one is the only candidate left
    assert [(c["id"], c["lat"], c["lng"], c["price"]) for c in response.json()] == [
        (str(card.id), None, None, None)
    ]
