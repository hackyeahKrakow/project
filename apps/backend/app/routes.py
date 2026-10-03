from fastapi import APIRouter, HTTPException, status
from pydantic.types import UUID7

from app.logger import get_logger
from app.schemas import (
    CardFetchResponse,
    CardResponseOut,
    CardResponseRequest,
    ErrorResponse,
    HealthResponse,
)

router = APIRouter()
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
    "/card/{user_id}",
    operation_id="card_fetch",
    summary="Get the next card for a user",
    description="Returns exactly one event card the user has not responded to yet.",
    response_model=CardFetchResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No more cards for this user"},
        501: {"model": ErrorResponse, "description": "Not implemented yet"},
    },
)
async def card_fetch(user_id: UUID7) -> CardFetchResponse:
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
        501: {"model": ErrorResponse, "description": "Not implemented yet"},
    },
)
async def card_response(user_id: UUID7, body: CardResponseRequest) -> CardResponseOut:
    log.info("card_response_called", user_id=str(user_id), card_id=str(body.card_id))
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
