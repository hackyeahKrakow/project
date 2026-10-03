from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic.types import UUID7
from sqlalchemy.ext.asyncio import AsyncSession

from app.card_service import get_next_card
from app.database import get_session
from app.jev_client import JevClient, get_jev_client
from app.logger import get_logger
from app.recommender import get_recommendations
from app.schemas import (
    CardFetchResponse,
    CardResponseOut,
    CardResponseRequest,
    ErrorResponse,
    HealthResponse,
)

router = APIRouter()

UserId = Annotated[
    UUID7,
    Path(
        description="Identifier of the user (UUID7)",
        examples=["018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90"],
    ),
]
log = get_logger(__name__)


@router.get(
    "/health",
    operation_id="health",
    summary="Health check",
    description="Returns `ok` when the service is running.",
    response_model=HealthResponse,
)
async def health() -> HealthResponse:
    log.info("health_checked")
    return HealthResponse(status="ok")


@router.get(
    "/card/new/{user_id}",
    operation_id="card_new",
    summary="Get the next card in the fixed sequence",
    description=(
        "Returns the next of six predefined cards (numbered 1 to 6) for this user, in order. "
        "The service remembers each user's position, so a card is never returned twice to the "
        "same user. After card 6 it returns 404."
    ),
    response_model=CardFetchResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No more cards"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def card_new(
    user_id: UserId, session: Annotated[AsyncSession, Depends(get_session)]
) -> CardFetchResponse:
    card = await get_next_card(session, user_id)
    if card is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No more cards")
    return CardFetchResponse.model_validate(card)


@router.get(
    "/card/recommendations/{user_id}",
    operation_id="card_recommendations",
    summary="Get up to 10 recommended cards for a user",
    description=(
        "Draws up to 50 random cards the user has not answered, evaluates them with the Jev "
        "model using the user's earlier right (interested) and left (not interested) answers, "
        "and returns the 10 best matches in ranked order. Returns fewer cards when fewer "
        "candidates exist and an empty list when none exist. If the AI is unavailable the "
        "result is up to 10 random candidates."
    ),
    response_model=list[CardFetchResponse],
    responses={422: {"model": ErrorResponse, "description": "Invalid request"}},
)
async def card_recommendations(
    user_id: UserId,
    session: Annotated[AsyncSession, Depends(get_session)],
    jev: Annotated[JevClient, Depends(get_jev_client)],
) -> list[CardFetchResponse]:
    cards = await get_recommendations(session, jev, user_id)
    return [CardFetchResponse.model_validate(card) for card in cards]


@router.get(
    "/card/{user_id}",
    operation_id="card_fetch",
    summary="Get the next card for a user",
    description="Returns exactly one event card the user has not responded to yet.",
    response_model=CardFetchResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No more cards for this user"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
        501: {"model": ErrorResponse, "description": "Not implemented yet"},
    },
)
async def card_fetch(user_id: UserId) -> CardFetchResponse:
    log.info("card_fetch_called", user_id=str(user_id))
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")


@router.post(
    "/card/{user_id}",
    operation_id="card_response",
    summary="Respond to a card",
    description=(
        "Records the user's swipe decision "
        "(`right` = interested, `left` = not interested) for a card."
    ),
    status_code=status.HTTP_201_CREATED,
    response_model=CardResponseOut,
    responses={
        404: {"model": ErrorResponse, "description": "Card not found"},
        409: {"model": ErrorResponse, "description": "User already responded to this card"},
        422: {"model": ErrorResponse, "description": "Invalid request"},
        501: {"model": ErrorResponse, "description": "Not implemented yet"},
    },
)
async def card_response(user_id: UserId, body: CardResponseRequest) -> CardResponseOut:
    log.info("card_response_called", user_id=str(user_id), card_id=str(body.card_id))
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
