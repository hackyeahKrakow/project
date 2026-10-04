"""Make the cards table match the catalog in app/seed_events.json.

Inserts missing cards, updates the ones that changed (times, places, categories) and deletes cards that left the
catalog. A card somebody already answered is kept, so no swipe loses its card. Uses DATABASE_URL / DATABASE_AUTH_TOKEN.

    uv run python scripts/replace_cards.py --dry-run
    uv run python scripts/replace_cards.py
"""

import asyncio
import sys

from sqlalchemy import delete, func, select

from app.database import engine, session_factory
from app.models import Card, CardSwipe
from app.seed import SEED_CARDS, _copy


async def main(dry_run: bool) -> int:
    keep = {card.id for card in SEED_CARDS}
    async with session_factory() as session:
        stale = list((await session.scalars(select(Card).where(Card.id.not_in(keep)))).all())
        answered = set(await session.scalars(select(CardSwipe.card_id).where(CardSwipe.card_id.not_in(keep))))
        drop = [c for c in stale if c.id not in answered]
        have = set(await session.scalars(select(Card.id).where(Card.id.in_(keep))))
        print(f"cards in the database: {await session.scalar(select(func.count()).select_from(Card))}")
        print(f"to delete (not in the catalog): {[c.event_name for c in drop]}")
        print(f"kept (not in the catalog, but answered): {[c.event_name for c in stale if c.id in answered]}")
        print(f"to insert: {len(keep - have)}, to update to the catalog: {len(have)}")
        if dry_run:
            print("dry run, nothing changed")
            return 0
        await session.execute(delete(Card).where(Card.id.in_([c.id for c in drop])))
        for card in SEED_CARDS:
            await session.merge(_copy(card))  # insert or overwrite with the catalog values
        await session.commit()
        print(f"cards in the database now: {await session.scalar(select(func.count()).select_from(Card))}")
    await engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main("--dry-run" in sys.argv)))
