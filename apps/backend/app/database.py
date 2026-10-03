from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import Settings, get_settings


def create_engine(settings: Settings) -> AsyncEngine:
    if settings.database_url.startswith("libsql://"):
        from app.turso import create_turso_engine

        token = settings.database_auth_token
        return create_turso_engine(
            settings.database_url, token.get_secret_value() if token else None
        )
    return create_async_engine(settings.database_url)


engine = create_engine(get_settings())
session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session
