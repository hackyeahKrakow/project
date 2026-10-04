import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Dialect,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator
from uuid6 import uuid7

from app.database import Base


class UTCDateTime(TypeDecorator):
    """Stores datetimes as UTC and returns timezone-aware values (SQLite drops the timezone)."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Datetime must be timezone-aware")
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        return None if value is None else value.replace(tzinfo=timezone.utc)


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
    starts_at: Mapped[datetime] = mapped_column(UTCDateTime)
    ends_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    address: Mapped[str] = mapped_column(String(300))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    price: Mapped[float | None] = mapped_column(Float)  # 0 = free, NULL = unknown


class UserCardProgress(Base):
    __tablename__ = "user_card_progress"
    __table_args__ = (
        CheckConstraint("cards_served >= 0 AND cards_served <= 6", name="cards_served_range"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    cards_served: Mapped[int] = mapped_column(Integer, default=0)


class CardSwipe(Base):
    __tablename__ = "card_swipes"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    card_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("cards.id"), primary_key=True)
    swipe: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=lambda: datetime.now(timezone.utc)
    )


class UserInfo(Base):
    """Whatever JSON the client sent about the user; Jev gets it as the user's choices."""

    __tablename__ = "user_info"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    data: Mapped[str] = mapped_column(Text)  # the JSON document as text
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=lambda: datetime.now(timezone.utc)
    )
