"""Make the cards table hold exactly the catalog from app/seed_events.json.

Deletes cards that are not in the catalog (the old demo cards) and inserts the missing ones.
Refuses to delete a card somebody has already answered. Uses DATABASE_URL / DATABASE_AUTH_TOKEN.

    uv run python scripts/replace_cards.py --dry-run
    uv run python scripts/replace_cards.py
"""

import asyncio
import sys

from sqlalchemy import delete, func, select

from app.database import engine, session_factory
from app.models import Card, CardSwipe
from app.seed import SEED_CARDS, seed_cards


async def main(dry_run: bool) -> int:
    keep = {card.id for card in SEED_CARDS}
    async with session_factory() as session:
        stale = list((await session.scalars(select(Card).where(Card.id.not_in(keep)))).all())
        answered = await session.scalar(
            select(func.count()).select_from(CardSwipe).where(CardSwipe.card_id.not_in(keep))
        )
        have = set(await session.scalars(select(Card.id).where(Card.id.in_(keep))))
        print(f"cards in the database: {await session.scalar(select(func.count()).select_from(Card))}")
        print(f"to delete (not in the catalog): {[c.event_name for c in stale]}")
        print(f"to insert (missing from the database): {len(keep - have)}")
        if answered:
            print(f"ABORT: {answered} swipe(s) refer to cards that would be deleted")
            return 1
        if dry_run:
            print("dry run, nothing changed")
            return 0
        await session.execute(delete(Card).where(Card.id.not_in(keep)))
        await session.commit()
        added = await seed_cards(session)
        print(f"deleted {len(stale)}, inserted {added}")
        print(f"cards in the database now: {await session.scalar(select(func.count()).select_from(Card))}")
    await engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main("--dry-run" in sys.argv)))
