import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UserInfo

MAX_INFO_CHARS = 8_000  # about 2,000 tokens of Jev's context, which also holds the cards


class InfoTooLargeError(Exception):
    pass


async def save_info(session: AsyncSession, user_id: uuid.UUID, data: Any) -> datetime:
    """Store the user's JSON, replacing the previous one; returns the time it was saved."""
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(text) > MAX_INFO_CHARS:
        raise InfoTooLargeError
    now = datetime.now(timezone.utc)
    stmt = insert(UserInfo).values(user_id=user_id, data=text, updated_at=now)
    await session.execute(
        stmt.on_conflict_do_update(
            index_elements=[UserInfo.user_id], set_={"data": text, "updated_at": now}
        )
    )
    await session.commit()
    return now


async def load_info(session: AsyncSession, user_id: uuid.UUID) -> Any | None:
    """The JSON stored for the user, or None when there is none."""
    row = await session.get(UserInfo, user_id)
    return None if row is None else json.loads(row.data)
