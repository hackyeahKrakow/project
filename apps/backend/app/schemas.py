from datetime import date

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field
from pydantic.types import UUID7

from app.models import Decision


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
    ad_image_url: AnyHttpUrl = Field(description="URL of the advertisement graphic")
    event_date: date = Field(description="Date of the event")
    location_street: str = Field(max_length=200, description="Street / place of the event")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
                "event_name": "Krakow Night Market",
                "color_code": "#FF8800",
                "description": "Street food and live music.",
                "ad_image_url": "https://example.com/ads/night-market.png",
                "event_date": "2026-11-15",
                "location_street": "Rynek Glowny 1",
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

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
                "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
                "decision": "right",
            }
        },
    )
