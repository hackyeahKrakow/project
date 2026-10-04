import json
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.logger import get_logger
from app.models import Card

log = get_logger(__name__)

# The events in seed_events.json (a copy of data/events_oneoff.json, checked by a test) are the whole
# catalog. File order matters: the first STARTER_COUNT are the fixed sequence served by /card/new,
# position + 1 is the card number. The rest are reached through recommendations.
STARTER_COUNT = 6
SEED_FILE = Path(__file__).with_name("seed_events.json")


def _load_cards() -> list[Card]:
    return [
        Card(
            id=uuid.UUID(event["id"]),
            event_name=event["event_name"],
            color_code=event["color_code"],
            description=event["description"],
            image_url=event["image_url"],
            starts_at=datetime.fromisoformat(event["starts_at"]),
            ends_at=datetime.fromisoformat(event["ends_at"]) if event["ends_at"] else None,
            address=event["address"],
            lat=event["lat"],
            lng=event["lng"],
            price=event["price"],
        )
        for event in json.loads(SEED_FILE.read_text(encoding="utf-8"))
    ]


SEED_CARDS: list[Card] = _load_cards()
STARTER_CARDS: list[Card] = SEED_CARDS[:STARTER_COUNT]


async def seed_cards(session: AsyncSession) -> int:
    existing = set(
        (await session.scalars(select(Card.id).where(Card.id.in_([c.id for c in SEED_CARDS]))))
    )
    missing = [_copy(card) for card in SEED_CARDS if card.id not in existing]
    session.add_all(missing)
    await session.commit()
    log.info("cards_seeded", added=len(missing))
    return len(missing)


def _copy(card: Card) -> Card:
    return Card(
        id=card.id,
        event_name=card.event_name,
        color_code=card.color_code,
        description=card.description,
        image_url=card.image_url,
        starts_at=card.starts_at,
        ends_at=card.ends_at,
        address=card.address,
        lat=card.lat,
        lng=card.lng,
        price=card.price,
    )
