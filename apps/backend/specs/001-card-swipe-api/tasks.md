---

description: "Task list for Card Swipe API"
---

# Tasks: Card Swipe API

**Input**: Design documents from `specs/001-card-swipe-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested in the spec. Only minimal smoke tests are included, as listed in plan.md.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend/`
(constitution: only files inside `apps/backend` may be changed). Keep the existing flat
`app/` file layout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and package layout

- [X] T001 Update dependencies in pyproject.toml via uv: replace `fastapi>=0.104.0` and `uvicorn[standard]>=0.24.0` with `fastapi[standard]` (needed for `fastapi dev`), and add `sqlalchemy[asyncio]`, `aiosqlite`, `pydantic-settings`, `structlog`, `uuid6`; add dev group `pytest`, `pytest-asyncio`, `httpx`; run `uv sync` to refresh uv.lock
- [X] T002 [P] Create empty app/__init__.py so `app` is a package (needed for `from app.config import ...` under `fastapi dev`)
- [X] T003 [P] Fill .env.example with placeholder-only variables: `APP_NAME`, `ENVIRONMENT=dev`, `LOG_LEVEL=INFO`, `DATABASE_URL=sqlite+aiosqlite:///./app.db`, `API_KEY=change-me` (no real secrets)
- [X] T004 [P] Ensure `.env` and `*.db` are git-ignored: add a `apps/backend/.gitignore` containing `.env`, `*.db`, `__pycache__/`, `.venv/` (do not edit the root .gitignore)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Implement `Settings(BaseSettings)` in app/config.py with fields `app_name: str`, `environment: str = "dev"`, `log_level: str = "INFO"`, `database_url: str = "sqlite+aiosqlite:///./app.db"`, `api_key: SecretStr | None = None`; read env vars and a `.env` file; add cached `get_settings()` usable as a FastAPI dependency
- [X] T006 [P] Implement structlog setup in new file app/logger.py: `configure_logging(settings)` (JSON renderer when `environment != "dev"`, console renderer in `dev`; ISO timestamps, log level, contextvars merge) and `get_logger(name)`; never log secret values
- [X] T007 Implement app/database.py: async engine from `settings.database_url` (`create_async_engine`), `async_sessionmaker(expire_on_commit=False)`, `Base(DeclarativeBase)`, and an async generator dependency `get_session()` (depends on T005)
- [X] T008 Implement `init_db()` in app/init.py: async function running `Base.metadata.create_all` via `engine.begin()` and logging the result (depends on T007)
- [X] T009 Add `ErrorResponse` (field `detail: str`) to app/schemas.py (shared by US2 and US3 error responses)
- [X] T010 Implement app/main.py: FastAPI app with title and description, `lifespan` that calls `configure_logging` then `init_db()`, and `include_router` for the router from app/routes.py; create an empty `router = APIRouter()` in app/routes.py first if it does not exist yet (depends on T006, T008)

**Checkpoint**: `uv run fastapi dev app/main.py` starts, logs structured lines and creates the SQLite file

---

## Phase 3: User Story 1 - Check that the service is alive (Priority: P1) 🎯 MVP

**Goal**: `GET /health` confirms the service is running.

**Independent Test**: `curl http://127.0.0.1:8000/health` returns `{"status":"ok"}` with HTTP 200.

- [X] T011 [US1] Add `HealthResponse` schema to app/schemas.py with field `status: str` and a `json_schema_extra` example `{"status": "ok"}`
- [X] T012 [US1] Add `GET /health` (`operation_id="health"`, summary "Health check", description "Returns ok when the service is running", `response_model=HealthResponse`) to app/routes.py, logging one structured line per call (depends on T011)
- [X] T013 [US1] Add smoke test tests/test_health.py using httpx `AsyncClient` with `ASGITransport` to assert 200 and `{"status": "ok"}`; configure pytest-asyncio mode in pyproject.toml (depends on T012)

**Checkpoint**: User Story 1 works on its own (MVP)

---

## Phase 4: User Story 2 - Receive one event card to decide on (Priority: P2)

**Goal**: `card_fetch` contract, schema and model exist; endpoint is a documented skeleton.

**Independent Test**: `/docs` shows `GET /card/{user_id}` with summary, description, schema and example; calling it returns 501; `GET /card/not-a-uuid` returns 422.

- [X] T014 [P] [US2] Add `Card` model to app/models.py (table `cards`): `id` UUID7 primary key defaulting to `uuid6.uuid7()` using SQLAlchemy `Uuid`; `event_name` String(200) required; `color_code` String(7) required, format `#RRGGBB`; `description` Text required; `ad_image_url` String(2048) required, http(s) URL; `event_date` Date required; `location_street` String(200) required; use `Mapped[...]`/`mapped_column`, inherit `Base`
- [X] T015 [P] [US2] Add `CardFetchResponse` to app/schemas.py with fields `id` (pydantic `UUID7`), `event_name` (max 200), `color_code` (regex `^#[0-9A-Fa-f]{6}$`), `description`, `ad_image_url` (`AnyHttpUrl`), `event_date` (`date`), `location_street` (max 200); `from_attributes=True`; every field has `Field(description=...)` and the class has the example from contracts/api.md
- [X] T016 [US2] Add `GET /card/{user_id}` to app/routes.py: `operation_id="card_fetch"`, summary "Get the next card for a user", description "Returns exactly one event card the user has not responded to yet", `user_id: UUID7` path param, `response_model=CardFetchResponse`, documented `responses` for 404 (`ErrorResponse`, no more cards) and 501; body logs and raises `HTTPException(status_code=501, detail="Not implemented")` (depends on T015)
- [X] T017 [US2] Add tests/test_cards.py: `GET /card/<valid uuid7>` returns 501 and `GET /card/not-a-uuid` returns 422 (depends on T016)

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - Respond to a card with a swipe decision (Priority: P3)

**Goal**: `card_response` contract, schema and model exist; endpoint is a documented skeleton.

**Independent Test**: `/docs` shows `POST /card/{user_id}` with request body example; valid body returns 501; decision other than `right`/`left` returns 422.

- [X] T018 [US3] Add `Decision(str, enum.Enum)` (`right`, `left`) and `CardResponse` model to app/models.py (table `card_responses`): `user_id` UUID primary key part, `card_id` UUID primary key part with `ForeignKey("cards.id")`, `decision` `Enum(Decision, native_enum=False)` required; composite primary key (`user_id`, `card_id`) so a user has at most one response per card; add `relationship` to `Card` (depends on T014)
- [X] T019 [US3] Add `CardResponseRequest` (`card_id: UUID7`, `decision: Decision`) and `CardResponseOut` (`card_id: UUID7`, `user_id: UUID7`, `decision: Decision`, `from_attributes=True`) to app/schemas.py with `Field` descriptions and the examples from contracts/api.md (depends on T018)
- [X] T020 [US3] Add `POST /card/{user_id}` to app/routes.py: `operation_id="card_response"`, status 201, summary "Respond to a card", description "Records the user's swipe decision (right = interested, left = not interested) for a card", `user_id: UUID7` path param, body `CardResponseRequest`, `response_model=CardResponseOut`, documented `responses` for 404 (card not found), 409 (already responded), 501; body logs and raises `HTTPException(status_code=501, detail="Not implemented")` (depends on T019)
- [X] T021 [US3] Extend tests/test_cards.py: valid body returns 501, decision `"up"` returns 422, `card_id` that is not a UUID7 returns 422 (depends on T020)

**Checkpoint**: All user stories are independently functional as skeletons

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 [P] Verify every route in app/routes.py shows summary, description, typed schemas and example at `/docs` and matches specs/001-card-swipe-api/contracts/api.md
- [X] T023 Run `uv run pytest` and the validation steps in specs/001-card-swipe-api/quickstart.md; fix any mismatch
- [X] T024 [P] Confirm no secrets are committed: `git grep -n -i "api_key\|secret\|password"` shows only placeholders and the Settings field name; make sure `.env` and `*.db` are untracked

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → user stories → Polish.
- US1 needs only Phase 2. US2 and US3 need Phase 2; US3 also uses the `Card` model from T014 and shares app/routes.py, app/schemas.py and app/models.py with earlier stories, so edit those files one task at a time.
- Within a story: models/schemas → routes → tests.

## Parallel Opportunities

- Phase 1: T002, T003, T004 together after T001.
- Phase 2: T005 and T006 together.
- Phase 4: T014 and T015 together (different files).

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + User Story 1 (running service with working `/health`).
- Then add US2 and US3 in priority order, committing and pushing to `feature/card_swipe_endpoints` after each turn.
- Real database logic for `card_fetch` and `card_response` is out of scope; it becomes a later feature.

## Phase 7: Convergence

- [ ] T025 Add a custom handler in app/main.py for `RequestValidationError` that returns HTTP 422 with an `ErrorResponse` body (`{"detail": "<message>"}`), and declare `422` with `ErrorResponse` in the `responses` of `card_fetch` and `card_response` in app/routes.py, so all error responses share one shape per FR-009 (partial)
- [ ] T026 [P] Add an example `user_id` (e.g. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`) to the `user_id` path parameters of `card_fetch` and `card_response` in app/routes.py using `Path(..., examples=[...], description=...)` so `/docs` shows an example request for both endpoints per FR-007, SC-002 and contracts/api.md (partial)
- [ ] T027 Extend tests/test_cards.py to assert the 422 body from T025 contains a string `detail` (depends on T025) per FR-009 (partial)
