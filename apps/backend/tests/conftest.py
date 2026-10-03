from collections.abc import AsyncGenerator, Callable
from datetime import datetime, timezone
from pathlib import Path

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.database import Base, get_session
from app.jev_client import JevClient, get_jev_client
from app.main import app
from app.models import Card
from app.seed import seed_cards


async def make_database(path: Path) -> tuple[AsyncEngine, async_sessionmaker]:
    engine = create_async_engine(f"sqlite+aiosqlite:///{path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        await seed_cards(session)
    return engine, factory


def make_client(factory: async_sessionmaker) -> httpx.AsyncClient:
    async def override_session():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "test.db"


@pytest.fixture
async def session_factory(db_path: Path) -> AsyncGenerator[async_sessionmaker, None]:
    engine, factory = await make_database(db_path)
    yield factory
    await engine.dispose()


@pytest.fixture
async def db_client(session_factory: async_sessionmaker) -> AsyncGenerator[httpx.AsyncClient, None]:
    async with make_client(session_factory) as client:
        yield client
    app.dependency_overrides.clear()


async def add_cards(factory: async_sessionmaker, n: int) -> list[Card]:
    """Add n extra cards, alternating "Music event i" and "Sport event i"."""
    from uuid6 import uuid7

    cards = [
        Card(
            id=uuid7(),
            event_name=f"{'Music' if i % 2 == 0 else 'Sport'} event {i}",
            color_code="#112233",
            description=f"Description of event {i}",
            image_url=None,
            starts_at=datetime(2026, 12, 1, 18, 0, tzinfo=timezone.utc),
            ends_at=None,
            address=f"Street {i}, Krakow",
            lat=50.06,
            lng=19.94,
            price=0,
        )
        for i in range(n)
    ]
    async with factory() as session:
        session.add_all(cards)
        await session.commit()
    return cards


def make_jev_client(handler: Callable[[httpx.Request], httpx.Response]) -> JevClient:
    return JevClient(
        api_key="test-key",
        model="jev-test",
        url="https://jev.test/systemone",
        timeout=2.0,
        transport=httpx.MockTransport(handler),
    )


def jev_override(client: JevClient) -> None:
    app.dependency_overrides[get_jev_client] = lambda: client
