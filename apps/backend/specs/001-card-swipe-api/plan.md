# Implementation Plan: Card Swipe API

**Branch**: `feature/card_swipe_endpoints` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-card-swipe-api/spec.md`

## Summary

Create the skeleton of a FastAPI backend: a working `GET /health`, and documented but not yet
implemented `GET /card/{user_id}` (`card_fetch`) and `POST /card/{user_id}` (`card_response`),
plus Pydantic schemas and async SQLAlchemy models for `Card` and `CardResponse`. The existing
flat layout in `apps/backend/app/` (`config.py`, `database.py`, `init.py`, `main.py`,
`models.py`, `routes.py`, `schemas.py`) is kept; each file gets one clear responsibility.
Research decisions are in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+ (project `requires-python >=3.11`)

**Primary Dependencies**: FastAPI (`fastapi[standard]` for the `fastapi dev` CLI), SQLAlchemy 2.x
(async), aiosqlite, Pydantic v2, pydantic-settings, structlog, uuid6 (UUID7 generation)

**Storage**: SQLite file via SQLAlchemy async engine (`sqlite+aiosqlite`)

**Testing**: pytest + pytest-asyncio + httpx (minimal smoke/contract tests, dev dependencies only)

**Target Platform**: Linux server / developer machines

**Project Type**: web-service (backend only; `apps/frontend` is out of scope)

**Performance Goals**: `/health` answers in under 1 second (SC-001); no other targets for a skeleton

**Constraints**: all changes stay inside `apps/backend`; no secrets committed; async/await
throughout; keep the current file structure

**Scale/Scope**: hackathon-size app, 3 endpoints, 2 tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Clean, maintainable code | Pass | One responsibility per file; typed, documented |
| II. Modular design | Pass | routes / schemas / models / database / config / logger separated |
| III. Simplicity first | Pass | No Alembic, no repository layer, no auth; justified in research.md |
| IV. Research before implementing | Pass | [research.md](research.md) written before any code |
| V. Ask when unsure | Pass | Open points listed in research.md "Open questions" |
| Secrets never committed | Pass | Settings read from env / git-ignored `.env`; `.env.example` has placeholders only |
| Branch per feature, commit each turn | Pass | `feature/card_swipe_endpoints` |
| Only touch `apps/backend` | Pass | All paths below are inside `apps/backend` |

Post-design re-check: no violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-card-swipe-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output: endpoint contracts
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (apps/backend)

```text
apps/backend/
├── pyproject.toml        # + dependencies (see research.md)
├── .env.example          # + placeholder variables
├── app/
│   ├── __init__.py       # NEW (empty): makes `app` a package so `fastapi dev` resolves imports
│   ├── main.py           # FastAPI app, lifespan (logging + DB init), includes router
│   ├── config.py         # Settings (pydantic-settings) + get_settings()
│   ├── database.py       # Async engine, session factory, Base, get_session dependency
│   ├── init.py           # init_db(): create tables at startup
│   ├── models.py         # SQLAlchemy models: Card, CardResponse, Decision enum
│   ├── schemas.py        # Pydantic schemas: CardFetchResponse, CardResponseRequest, ...
│   ├── routes.py         # APIRouter: /health, /card/{user_id} GET and POST (skeletons)
│   └── logger.py         # NEW: structlog configuration + get_logger()
└── tests/
    └── test_health.py    # NEW: smoke test for /health and 501 skeletons
```

**Structure Decision**: Keep the existing flat `app/` files unchanged in name and number. Only two
small files are added (`__init__.py`, `logger.py`) plus `tests/`. A package split (routers/,
services/) is deferred until the app outgrows single files.

## Complexity Tracking

No constitution violations; nothing to justify.
