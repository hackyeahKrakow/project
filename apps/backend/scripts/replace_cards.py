"""Make the cards table hold exactly the catalog from app/seed_events.json.

Deletes cards that are not in the catalog (the old demo cards) and inserts the missing ones.
Refuses to delete a card somebody has already answered. With --sync it also overwrites the fields of
cards that are already in the database with the values from the file (seeding on startup never does).
Uses DATABASE_URL / DATABASE_AUTH_TOKEN.

    uv run python scripts/replace_cards.py --dry-run
    uv run python scripts/replace_cards.py
    uv run python scripts/replace_cards.py --sync
"""

import asyncio
import sys

from sqlalchemy import delete, func, select

from app.database import engine, session_factory
from app.models import Card, CardSwipe
from app.seed import SEED_CARDS, seed_cards


FIELDS = ("event_name", "color_code", "description", "image_url", "starts_at", "ends_at", "address", "lat", "lng", "price")


async def _outdated(session) -> list[tuple[Card, dict]]:
    """Cards in the database whose fields differ from the file, with the values to write."""
    by_id = {card.id: card for card in SEED_CARDS}
    found = []
    for card in (await session.scalars(select(Card).where(Card.id.in_(by_id)))).all():
        wanted = {f: getattr(by_id[card.id], f) for f in FIELDS}
        changes = {f: v for f, v in wanted.items() if getattr(card, f) != v}
        if changes:
            found.append((card, changes))
    return found


async def main(dry_run: bool, sync: bool) -> int:
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
        outdated = await _outdated(session) if sync else []
        if sync:
            print(f"to update (fields differ from the file): {[(c.event_name[:30], sorted(ch)) for c, ch in outdated]}")
        if answered:
            print(f"ABORT: {answered} swipe(s) refer to cards that would be deleted")
            return 1
        if dry_run:
            print("dry run, nothing changed")
            return 0
        await session.execute(delete(Card).where(Card.id.not_in(keep)))
        await session.commit()
        added = await seed_cards(session)
        for card, changes in outdated:
            for field, value in changes.items():
                setattr(card, field, value)
        await session.commit()
        print(f"deleted {len(stale)}, inserted {added}, updated {len(outdated)}")
        print(f"cards in the database now: {await session.scalar(select(func.count()).select_from(Card))}")
    await engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main("--dry-run" in sys.argv, "--sync" in sys.argv)))
