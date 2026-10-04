from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.types import UUID7

from app.models import CardSwipe, Decision


class ErrorResponse(BaseModel):
    detail: str = Field(description="Human-readable error message")


class HealthResponse(BaseModel):
    status: str = Field(description="Service status, `ok` when running")

    model_config = ConfigDict(json_schema_extra={"example": {"status": "ok"}})


class CardFetchResponse(BaseModel):
    id: UUID7 = Field(description="Unique card identifier (UUID7)")
    event_name: str = Field(max_length=200, description="Name of the event")
    color_code: str = Field(
        pattern=r"^#[0-9A-Fa-f]{6}$", description="Card color as hex, e.g. #FF8800"
    )
    description: str = Field(description="Event description")
    image_url: str | None = Field(
        max_length=2048,
        description="Relative API path to the image, or null (frontend shows a category placeholder)",
    )
    starts_at: datetime = Field(description="Start of the event, ISO 8601")
    ends_at: datetime | None = Field(description="End of the event, ISO 8601, may be null")
    address: str = Field(max_length=300, description="Address shown to the user")
    lat: float | None = Field(
        ge=-90, le=90, description="Latitude for the map pin, null when the place is not geocoded yet"
    )
    lng: float | None = Field(
        ge=-180, le=180, description="Longitude for the map pin, null when the place is not geocoded yet"
    )
    price: float | None = Field(ge=0, description="Price in PLN, 0 = free, null when unknown")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
                "event_name": "Krakow Night Market",
                "color_code": "#FF8800",
                "description": "Street food and live music.",
                "image_url": "/images/night-market.png",
                "starts_at": "2026-11-15T18:00:00+01:00",
                "ends_at": None,
                "address": "Rynek Glowny 1, Krakow",
                "lat": 50.0617,
                "lng": 19.9373,
                "price": 0,
            }
        },
    )


class CardResponseRequest(BaseModel):
    card_id: UUID7 = Field(description="Identifier of the card being answered")
    decision: Decision = Field(description="`right` = interested, `left` = not interested")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
                "decision": "right",
            }
        }
    )


class CardResponseOut(BaseModel):
    card_id: UUID7 = Field(description="Identifier of the answered card")
    user_id: UUID7 = Field(description="Identifier of the user who answered")
    decision: Decision = Field(description="The recorded decision")
    created_at: datetime = Field(description="Time the answer was saved, ISO 8601 in UTC")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
                "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
                "decision": "right",
                "created_at": "2026-10-03T15:42:10.123456Z",
            }
        },
    )

    @classmethod
    def from_swipe(cls, swipe: CardSwipe) -> "CardResponseOut":
        return cls(
            card_id=swipe.card_id,
            user_id=swipe.user_id,
            decision=Decision.RIGHT if swipe.swipe else Decision.LEFT,
            created_at=swipe.created_at,
        )


class InfoOut(BaseModel):
    user_id: UUID7 = Field(description="Identifier of the user the JSON was saved for")
    updated_at: datetime = Field(description="Time the JSON was saved, ISO 8601 in UTC")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
                "updated_at": "2026-10-03T15:42:10.123456Z",
            }
        }
    )
