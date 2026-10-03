# Implementation Plan: Sequential Card Feed

**Branch**: `feature/backend_logic` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-sequential-card-feed/spec.md`

## Summary

Add `GET /card/new/{user_id}`. Six fixed sample cards (numbered 1 to 6, fixed UUID7 ids) are stored
in the existing `cards` table at startup. A new table remembers, per user, how many cards were
already served. Each request atomically advances that counter and returns the matching card, or
`404` once all six were served. The existing `CardFetchResponse` schema and async SQLAlchemy setup
are reused. Decisions are in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**: FastAPI, SQLAlchemy 2.x async, aiosqlite, Pydantic v2, structlog, uuid6
(all already installed; nothing new to add)

**Storage**: Existing SQLite database; one new table `user_card_progress`; six seeded rows in `cards`

**Testing**: pytest + pytest-asyncio + httpx; tests use a throwaway in-memory SQLite database

**Target Platform**: Linux server / developer machines

**Project Type**: web-service (backend only)

**Performance Goals**: card delivered in under 1 second (SC-004)

**Constraints**: keep existing flat `app/` layout; no changes outside `apps/backend`; progress must
survive restarts and be race-free per user

**Scale/Scope**: 1 endpoint, 1 new table, 6 sample cards

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Simplicity in 24 hours | Pass | SQLite counter, hardcoded cards, no recommendation logic |
| II. Data legality | Pass | Sample cards are written by us, no scraped content |
| III. Privacy | Pass | Only an anonymous user UUID and a counter are stored; no location or personal data |
| IV. AI under human control | N/A | No AI used |
| Quality and workflow rules (v1.1.0) | Pass | Modular files, secrets untouched, branch `feature/backend_logic`, changes only in `apps/backend` |

Post-design re-check: no violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-sequential-card-feed/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (apps/backend)

```text
apps/backend/
├── app/
│   ├── models.py         # + UserCardProgress model
│   ├── seed.py           # NEW: the six hardcoded cards (in order) + seed_cards()
│   ├── card_service.py   # NEW: get_next_card(session, user_id) - progress logic
│   ├── init.py           # call seed_cards() after create_all
│   └── routes.py         # + GET /card/new/{user_id} (thin, calls the service)
└── tests/
    ├── conftest.py       # NEW: in-memory DB + dependency override fixture
    └── test_card_new.py  # NEW: sequence, per-user, exhaustion, validation tests
```

**Structure Decision**: Keep the existing flat files. Two small new modules keep the data
(`seed.py`) and the logic (`card_service.py`) out of the route function, per the modularity rule.
`schemas.py` is reused unchanged (`CardFetchResponse`, `ErrorResponse`).

## Complexity Tracking

No constitution violations; nothing to justify.
