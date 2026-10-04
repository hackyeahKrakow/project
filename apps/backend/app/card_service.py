import uuid

from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.logger import get_logger
from app.models import Card, CardSwipe, Decision, UserCardProgress
from app.seed import STARTER_CARDS

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
            UserCardProgress.cards_served < len(STARTER_CARDS),
        )
        .values(cards_served=UserCardProgress.cards_served + 1)
        .returning(UserCardProgress.cards_served)
    )
    served = result.scalar_one_or_none()
    if served is None:
        await session.commit()
        log.info("no_more_cards", user_id=str(user_id))
        return None

    card = await session.get(Card, STARTER_CARDS[served - 1].id)
    await session.commit()
    log.info("card_served", user_id=str(user_id), card_number=served)
    return card


class CardNotFoundError(Exception):
    pass


class AlreadyAnsweredError(Exception):
    pass


async def record_swipe(
    session: AsyncSession, user_id: uuid.UUID, card_id: uuid.UUID, decision: Decision
) -> CardSwipe:
    """Save the user's answer to a card; one answer per user and card."""
    if await session.get(Card, card_id) is None:
        raise CardNotFoundError
    swipe = CardSwipe(user_id=user_id, card_id=card_id, swipe=decision is Decision.RIGHT)
    session.add(swipe)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise AlreadyAnsweredError from exc
    await session.refresh(swipe)
    log.info("swipe_saved", user_id=str(user_id), card_id=str(card_id), swipe=swipe.swipe)
    return swipe
