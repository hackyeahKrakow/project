import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid6 import uuid7

from app.database import Base


class Decision(str, enum.Enum):
    RIGHT = "right"
    LEFT = "left"


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    event_name: Mapped[str] = mapped_column(String(200))
    color_code: Mapped[str] = mapped_column(String(7))
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(2048))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    address: Mapped[str] = mapped_column(String(300))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float, default=0)

    responses: Mapped[list["CardResponse"]] = relationship(back_populates="card")


class CardResponse(Base):
    __tablename__ = "card_responses"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    card_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("cards.id"), primary_key=True
    )
    decision: Mapped[Decision] = mapped_column(Enum(Decision, native_enum=False))

    card: Mapped[Card] = relationship(back_populates="responses")
