from collections.abc import AsyncGenerator
from pathlib import Path

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.database import Base, get_session
from app.main import app
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
