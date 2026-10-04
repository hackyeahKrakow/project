import json
import random
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.fallback_decider import FallbackDecider, FallbackError
from app.info_service import load_info
from app.jev_client import INSTRUCTIONS, JevClient, JevError
from app.logger import get_logger
from app.models import Card, CardSwipe

log = get_logger(__name__)

MAX_CANDIDATES = 50
MAX_RECOMMENDED = 10
DESCRIPTION_LIMIT = 150
MAX_STATE_TOKENS = 20_000  # Jev context limit is 32,000 tokens (state + questions)
CHARS_PER_TOKEN = 4
QUESTION_OVERHEAD_CHARS = len(INSTRUCTIONS) + 60


async def get_recommendations(
    session: AsyncSession,
    jev: JevClient,
    user_id: uuid.UUID,
    fallback: FallbackDecider | None = None,
) -> list[Card]:
    """Return up to 10 cards for the user, chosen by Jev from up to 50 random unanswered cards.

    Cards Jev is unsure about are decided by the `fallback` model instead (see `_apply_fallback`).
    """
    candidates = await _candidates(session, user_id)
    if not candidates:
        return []

    history = await _history(session, user_id)
    choices = await load_info(session, user_id)
    if not history and choices is None:
        log.info("recommendations_cold_start", candidates=len(candidates))
        return candidates[:MAX_RECOMMENDED]

    state = _build_state(candidates, history, choices)
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
        has_choices="choices" in state,
        scored=len(scores),
    )
    if fallback is not None:
        scores = await _apply_fallback(fallback, state, scores, get_settings().jev_min_confidence)
    return _rank(candidates, scores)


def _confidence(probability: float | None) -> float:
    """0 when Jev has no answer or says 50/50, 1 when it is certain either way."""
    return 0.0 if probability is None else abs(probability - 0.5) * 2


async def _apply_fallback(
    fallback: FallbackDecider, state: dict, scores: dict[str, float], min_confidence: float
) -> dict[str, float]:
    """Let the fallback model decide the candidates Jev is not confident about.

    A yes scores 0.5 + min_confidence / 2 and a no 0.5 - min_confidence / 2: the edges of the band
    Jev was unsure in, so a decided card ranks below every confident yes of Jev and above every
    confident no. Without an answer from the fallback model, the Jev score (if any) stays.
    """
    uncertain = [
        card for card in state["candidates"] if _confidence(scores.get(card["id"])) < min_confidence
    ]
    if not uncertain:
        return scores
    try:
        routing = {
            "candidates_total": len(state["candidates"]),
            "scored_by_jev": len(scores),
            "uncertain_share": round(len(uncertain) / len(state["candidates"]), 2),
            "min_confidence": min_confidence,
        }
        decisions = await fallback.decide({**state, "candidates": uncertain}, routing)
    except FallbackError as exc:
        log.warning("fallback_failed", reason=str(exc), uncertain=len(uncertain))
        return scores
    log.info("fallback_decided", uncertain=len(uncertain), decided=len(decisions))
    edge = min_confidence / 2
    return {**scores, **{card_id: 0.5 + edge if yes else 0.5 - edge for card_id, yes in decisions.items()}}


async def _candidates(session: AsyncSession, user_id: uuid.UUID) -> list[Card]:
    answered = select(CardSwipe.card_id).where(CardSwipe.user_id == user_id)
    stmt = (
        select(Card)
        .where(Card.id.not_in(answered))
        .order_by(func.random())
        .limit(MAX_CANDIDATES)
    )
    return list((await session.scalars(stmt)).all())


async def _history(session: AsyncSession, user_id: uuid.UUID) -> list[tuple[Card, bool]]:
    stmt = (
        select(Card, CardSwipe.swipe)
        .join(CardSwipe, CardSwipe.card_id == Card.id)
        .where(CardSwipe.user_id == user_id)
    )
    return [(card, swipe) for card, swipe in (await session.execute(stmt)).all()]


def _compact(card: Card) -> dict:
    return {
        "id": str(card.id),
        "event_name": card.event_name,
        "description": card.description[:DESCRIPTION_LIMIT],
        "price": card.price,
        "address": card.address,
    }


def _build_state(
    candidates: list[Card], history: list[tuple[Card, bool]], choices: Any | None = None
) -> dict:
    candidate_items = [_compact(card) for card in candidates]
    budget = MAX_STATE_TOKENS * CHARS_PER_TOKEN
    budget -= len(json.dumps(candidate_items)) + len(candidates) * QUESTION_OVERHEAD_CHARS
    if choices is not None:
        budget -= len(json.dumps(choices))

    shuffled = list(history)
    random.shuffle(shuffled)
    liked: list[dict] = []
    disliked: list[dict] = []
    for card, swipe in shuffled:
        item = _compact(card)
        budget -= len(json.dumps(item))
        if budget < 0:
            break
        (liked if swipe else disliked).append(item)
    state = {"liked": liked, "disliked": disliked, "candidates": candidate_items}
    if choices is not None:
        state["choices"] = choices
    return state


def _rank(candidates: list[Card], scores: dict[str, float]) -> list[Card]:
    scored = [card for card in candidates if str(card.id) in scores]
    unscored = [card for card in candidates if str(card.id) not in scores]
    scored.sort(key=lambda card: -scores[str(card.id)])
    return (scored + unscored)[:MAX_RECOMMENDED]
