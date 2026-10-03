from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    detail = "; ".join(
        f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}" for err in exc.errors()
    )
    return JSONResponse(
        status_code=422, content={"detail": detail}
    )
