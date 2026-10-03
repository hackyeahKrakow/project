import json
import random
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.jev_client import INSTRUCTIONS, JevClient, JevError
from app.logger import get_logger
from app.models import Card, CardResponse, Decision

log = get_logger(__name__)

MAX_CANDIDATES = 50
MAX_RECOMMENDED = 10
DESCRIPTION_LIMIT = 150
MAX_STATE_TOKENS = 20_000  # Jev context limit is 32,000 tokens (state + questions)
CHARS_PER_TOKEN = 4
QUESTION_OVERHEAD_CHARS = len(INSTRUCTIONS) + 60


async def get_recommendations(
    session: AsyncSession, jev: JevClient, user_id: uuid.UUID
) -> list[Card]:
    """Return up to 10 cards for the user, chosen by Jev from up to 50 random unanswered cards."""
    candidates = await _candidates(session, user_id)
    if not candidates:
        return []

    history = await _history(session, user_id)
    if not history:
        log.info("recommendations_cold_start", candidates=len(candidates))
        return candidates[:MAX_RECOMMENDED]

    state = _build_state(candidates, history)
    try:
        scores = await jev.score_interest(state, [str(card.id) for card in candidates])
    except JevError as exc:
        log.warning("jev_failed", reason=str(exc), candidates=len(candidates))
        return candidates[:MAX_RECOMMENDED]
    log.info(
        "jev_scored",
        candidates=len(candidates),
        liked=len(state["liked"]),
        disliked=len(state["disliked"]),
        scored=len(scores),
    )
    return _rank(candidates, scores)


async def _candidates(session: AsyncSession, user_id: uuid.UUID) -> list[Card]:
    answered = select(CardResponse.card_id).where(CardResponse.user_id == user_id)
    stmt = (
        select(Card)
        .where(Card.id.not_in(answered))
        .order_by(func.random())
        .limit(MAX_CANDIDATES)
    )
    return list((await session.scalars(stmt)).all())


async def _history(session: AsyncSession, user_id: uuid.UUID) -> list[tuple[Card, Decision]]:
    stmt = (
        select(Card, CardResponse.decision)
        .join(CardResponse, CardResponse.card_id == Card.id)
        .where(CardResponse.user_id == user_id)
    )
    return [(card, decision) for card, decision in (await session.execute(stmt)).all()]


def _compact(card: Card) -> dict:
    return {
        "id": str(card.id),
        "event_name": card.event_name,
        "description": card.description[:DESCRIPTION_LIMIT],
        "price": card.price,
        "address": card.address,
    }


def _build_state(candidates: list[Card], history: list[tuple[Card, Decision]]) -> dict:
    candidate_items = [_compact(card) for card in candidates]
    budget = MAX_STATE_TOKENS * CHARS_PER_TOKEN
    budget -= len(json.dumps(candidate_items)) + len(candidates) * QUESTION_OVERHEAD_CHARS

    shuffled = list(history)
    random.shuffle(shuffled)
    liked: list[dict] = []
    disliked: list[dict] = []
    for card, decision in shuffled:
        item = _compact(card)
        budget -= len(json.dumps(item))
        if budget < 0:
            break
        (liked if decision == Decision.RIGHT else disliked).append(item)
    return {"liked": liked, "disliked": disliked, "candidates": candidate_items}


def _rank(candidates: list[Card], scores: dict[str, float]) -> list[Card]:
    scored = [card for card in candidates if str(card.id) in scores]
    unscored = [card for card in candidates if str(card.id) not in scores]
    scored.sort(key=lambda card: -scores[str(card.id)])
    return (scored + unscored)[:MAX_RECOMMENDED]
