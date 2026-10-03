import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String, Text, Uuid
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
    ad_image_url: Mapped[str] = mapped_column(String(2048))
    event_date: Mapped[date] = mapped_column(Date)
    location_street: Mapped[str] = mapped_column(String(200))

    responses: Mapped[list["CardResponse"]] = relationship(back_populates="card")


class CardResponse(Base):
    __tablename__ = "card_responses"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    card_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("cards.id"), primary_key=True
    )
    decision: Mapped[Decision] = mapped_column(Enum(Decision, native_enum=False))

    card: Mapped[Card] = relationship(back_populates="responses")
