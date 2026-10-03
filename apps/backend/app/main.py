from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.init import init_db
from app.logger import configure_logging, get_logger
from app.routes import router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging(get_settings())
    get_logger(__name__).info("startup", environment=get_settings().environment)
    await init_db()
    yield


app = FastAPI(
    title=get_settings().app_name,
    description="Swipe through event cards and record a decision on each.",
    lifespan=lifespan,
)
app.include_router(router)
