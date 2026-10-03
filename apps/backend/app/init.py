from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.database import Base, engine
from app.logger import get_logger

log = get_logger(__name__)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("database_initialized")
