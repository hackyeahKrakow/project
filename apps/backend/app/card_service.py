import uuid

from sqlalchemy import update
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.logger import get_logger
from app.models import Card, UserCardProgress
from app.seed import SEED_CARDS

log = get_logger(__name__)


async def get_next_card(session: AsyncSession, user_id: uuid.UUID) -> Card | None:
    """Return the next card for the user, or None when all cards were served."""
    await session.execute(
        insert(UserCardProgress)
        .values(user_id=user_id, cards_served=0)
        .on_conflict_do_nothing()
    )
    result = await session.execute(
        update(UserCardProgress)
        .where(
            UserCardProgress.user_id == user_id,
            UserCardProgress.cards_served < len(SEED_CARDS),
        )
        .values(cards_served=UserCardProgress.cards_served + 1)
        .returning(UserCardProgress.cards_served)
    )
    served = result.scalar_one_or_none()
    if served is None:
        await session.commit()
        log.info("no_more_cards", user_id=str(user_id))
        return None

    card = await session.get(Card, SEED_CARDS[served - 1].id)
    await session.commit()
    log.info("card_served", user_id=str(user_id), card_number=served)
    return card
