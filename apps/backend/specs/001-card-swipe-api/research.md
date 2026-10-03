# Research: Card Swipe API

Technology choices requested by the team: FastAPI, SQLAlchemy async, SQLite, Pydantic, structlog,
uv, pydantic settings. This file records the best practices to follow and the remaining decisions.
Version numbers are not pinned here; `uv add` resolves current releases.

## 1. Async SQLAlchemy with SQLite

- **Decision**: SQLAlchemy 2.x with `create_async_engine("sqlite+aiosqlite:///...")`,
  `async_sessionmaker(expire_on_commit=False)`, typed `DeclarativeBase` with `Mapped[...]` /
  `mapped_column(...)`. One session per request through a `get_session` FastAPI dependency
  (`async with` + yield).
- **Rationale**: This is the documented 2.0 style; `expire_on_commit=False` avoids lazy-load
  errors after commit in async code; aiosqlite is the async SQLite driver.
- **Alternatives**: SQLModel (rejected: team chose SQLAlchemy + Pydantic separately); sync engine
  (rejected: team wants async/await).

## 2. Creating tables

- **Decision**: `init_db()` in `app/init.py` runs `Base.metadata.create_all` inside the FastAPI
  lifespan at startup. No Alembic yet.
- **Rationale**: Simplest option for an empty-skeleton hackathon app (constitution III). Migrations
  can be added when the schema must change on existing data.
- **Alternatives**: Alembic (rejected for now: extra moving parts).

## 3. UUID7 identifiers

- **Decision**: Use the `uuid6` package (`uuid6.uuid7()`) to generate ids; store them with
  SQLAlchemy's `Uuid` type; validate incoming ids with Pydantic's `UUID7` type.
- **Rationale**: Python's standard `uuid.uuid7` only exists from Python 3.14, while this project
  supports 3.11. `uuid6` returns real `uuid.UUID` subclasses, so Pydantic/SQLAlchemy accept them.
- **Alternatives**: `uuid-utils` (Rust-backed; its UUID class is not a `uuid.UUID`, more friction).

## 4. Settings and secrets

- **Decision**: A `Settings(BaseSettings)` class in `app/config.py` using `pydantic-settings`,
  reading environment variables and a git-ignored `.env`; secrets typed as `SecretStr`; accessed via
  a cached `get_settings()` that is also injectable as a FastAPI dependency (easy to override in tests).
  Fields: `app_name`, `environment`, `log_level`, `database_url`, `api_key` (optional, reserved).
  `.env.example` lists names with placeholder values only.
- **Rationale**: Typed, validated, central config; satisfies the constitution rule that secrets are
  never committed (`.env` is already in the root `.gitignore`).

## 5. Structured logging

- **Decision**: `structlog` configured once at startup in `app/logger.py`: JSON output when
  `environment` is not `dev`, pretty console output in `dev`; ISO timestamps, log level, and
  contextvars support. Modules call `get_logger(__name__)`. Never log secrets.
- **Rationale**: Machine-readable logs in production, readable logs locally, minimal setup.

## 6. Pydantic schemas

- **Decision**: Separate request and response classes in `app/schemas.py`
  (`CardFetchResponse`, `CardResponseRequest`, `CardResponseOut`, `HealthResponse`,
  `ErrorResponse`), `model_config = ConfigDict(from_attributes=True)` for ORM output, `Field(...,
  description=..., examples=[...])` so docs show types, descriptions and example requests.
  Color code validated as `#RRGGBB` with a regex; `image_url` typed as an optional string (relative API path); decision is a
  `str` Enum (`right`, `left`).
- **Rationale**: FastAPI generates OpenAPI (summary, description, example) directly from these.

## 7. Endpoint skeletons

- **Decision**: `GET /health` returns `{"status": "ok"}` for real. The two card endpoints declare
  `summary`, `description`, `response_model`, documented error `responses`, and examples, but their
  bodies raise `HTTPException(501)`. `card_fetch` and `card_response` are the `operation_id`s.
- **Rationale**: Spec FR-008 asks for empty skeletons; an explicit 501 is honest and easy to find
  and replace later, instead of fake data.

## 8. Tooling

- **Decision**: uv manages dependencies (`uv add ...`). Run with `uv run fastapi dev app/main.py`
  from `apps/backend`. The current dependencies list `fastapi` + `uvicorn[standard]` only; the
  `fastapi dev` command needs the FastAPI CLI, so switch to `fastapi[standard]` (the locked
  `uv.lock` has no `fastapi-cli`). Dev dependencies: pytest, pytest-asyncio, httpx.
- **Package resolution**: add an empty `app/__init__.py` so `app` is a real package and
  `from app.config import ...` works under `fastapi dev`. (`app/init.py` is treated as the
  DB-init module, not `__init__.py`.)

## Open questions (non-blocking, defaults chosen)

1. Is `app/init.py` meant as DB initialization or as a misnamed `__init__.py`? Default: DB init, and
   a real `__init__.py` is added.
2. The team's card description for the response repeats the card fields; the model stores only
   `card_id`, `user_id`, `decision` and links to `Card` (no duplicated data).
3. Root docs say `uv run fastapi dev apps/backend/app/main.py` from the repo root. The root has no
   `pyproject.toml`, so this plan uses `apps/backend` as the working directory. Docs outside
   `apps/backend` are not modified (constitution).
