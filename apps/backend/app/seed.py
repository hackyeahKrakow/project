import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.logger import get_logger
from app.models import Card

log = get_logger(__name__)

_WARSAW = timezone(timedelta(hours=1))

# Order matters: list position + 1 is the card number (1 to 6).
SEED_CARDS: list[Card] = [
    Card(
        id=uuid.UUID("01a10200-0830-7370-ae21-2e47cc06805f"),
        event_name="Studencki Nocny Market",
        color_code="#FF8800",
        description="Street food, muzyka na żywo i stoiska kół naukowych.",
        image_url="/images/night-market.png",
        starts_at=datetime(2026, 11, 14, 18, 0, tzinfo=_WARSAW),
        ends_at=datetime(2026, 11, 14, 23, 0, tzinfo=_WARSAW),
        address="Rynek Główny 1, Kraków",
        lat=50.0617,
        lng=19.9373,
        price=0,
    ),
    Card(
        id=uuid.UUID("01a10200-0831-797f-b50e-774683352488"),
        event_name="Turniej gier planszowych",
        color_code="#7C3AED",
        description="Open turniej dla początkujących i zaawansowanych, nagrody dla zwycięzców.",
        image_url=None,
        starts_at=datetime(2026, 11, 15, 16, 0, tzinfo=_WARSAW),
        ends_at=None,
        address="ul. Reymonta 17, Kraków",
        lat=50.0647,
        lng=19.9234,
        price=10,
    ),
    Card(
        id=uuid.UUID("01a10200-0832-7c17-aa31-2be7e76e7a57"),
        event_name="Hackathon dla początkujących",
        color_code="#0EA5E9",
        description="Całodniowe warsztaty programowania w zespołach z mentorami.",
        image_url="/images/hackathon.png",
        starts_at=datetime(2026, 11, 20, 9, 0, tzinfo=_WARSAW),
        ends_at=datetime(2026, 11, 20, 20, 0, tzinfo=_WARSAW),
        address="ul. Podchorążych 2, Kraków",
        lat=50.0701,
        lng=19.9026,
        price=0,
    ),
    Card(
        id=uuid.UUID("01a10200-0833-793b-baed-a7c26b03f790"),
        event_name="Koncert w Rotundzie",
        color_code="#E11D48",
        description="Wieczór z lokalnymi zespołami studenckimi.",
        image_url="/images/concert.png",
        starts_at=datetime(2026, 11, 21, 19, 30, tzinfo=_WARSAW),
        ends_at=None,
        address="ul. Oleandry 1, Kraków",
        lat=50.0603,
        lng=19.9238,
        price=25,
    ),
    Card(
        id=uuid.UUID("01a10200-0834-7591-8c3e-835ac248aba0"),
        event_name="Spacer po Kazimierzu z przewodnikiem",
        color_code="#16A34A",
        description="Dwugodzinny spacer śladami historii dzielnicy, zniżki dla studentów.",
        image_url=None,
        starts_at=datetime(2026, 11, 22, 11, 0, tzinfo=_WARSAW),
        ends_at=datetime(2026, 11, 22, 13, 0, tzinfo=_WARSAW),
        address="Plac Wolnica 1, Kraków",
        lat=50.0494,
        lng=19.9455,
        price=15,
    ),
    Card(
        id=uuid.UUID("01a10200-0835-7c78-8dba-f85e707ea49e"),
        event_name="Wieczór kina studenckiego",
        color_code="#CA8A04",
        description="Pokaz krótkich filmów studentów i dyskusja z reżyserami.",
        image_url="/images/cinema.png",
        starts_at=datetime(2026, 11, 27, 20, 0, tzinfo=_WARSAW),
        ends_at=None,
        address="ul. Św. Tomasza 11, Kraków",
        lat=50.0636,
        lng=19.9411,
        price=0,
    ),
]


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
