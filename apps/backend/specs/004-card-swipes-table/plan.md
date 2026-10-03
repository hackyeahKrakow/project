# Implementation Plan: Card Swipes Table

**Branch**: `feature/card_swipes_table` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-card-swipes-table/spec.md`

## Summary

Add a `card_swipes` table (`card_id`, `user_id`, `swipe` boolean, `created_at`) and make
`POST /card/{user_id}` save one row per answer: `right` maps to `true`, `left` to `false`,
`created_at` is set by the service in UTC. A composite primary key `(user_id, card_id)` allows one
answer per user and card; a repeat returns 409, an unknown card 404. The table replaces the old
`card_responses` table: the recommender now reads history and exclusions from `card_swipes`.
Decisions are in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**: FastAPI, SQLAlchemy 2.x async, aiosqlite, Pydantic v2, structlog, uuid6
(all present; nothing new to install)

**Storage**: Existing SQLite; new table `card_swipes`, old `card_responses` model removed

**Testing**: pytest + pytest-asyncio + httpx (file-based temporary SQLite from `tests/conftest.py`)

**Target Platform**: Linux server / developer machines

**Project Type**: web-service (backend only)

**Performance Goals**: answering a card in under 1 second (SC-005)

**Constraints**: one answer per user and card (race-free); `created_at` never taken from the
client; keep the flat `app/` layout; no migration tool (the new table is created by `create_all`)

**Scale/Scope**: 1 table, 1 endpoint implemented, recommender switched to the new table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Simplicity in 24 hours | Pass | One table, composite key, no migrations, no new dependency |
| II. Data legality | Pass | Only our own anonymous swipe data |
| III. Privacy | Pass | Stores an anonymous user UUID, a card id, a boolean and a timestamp; no personal data or location |
| IV. AI under human control and code | Pass | The AI still only sees card details and decisions; its input now comes from `card_swipes` |
| Quality and workflow rules (v1.1.0) | Pass | Modular, branch `feature/card_swipes_table`, changes only in `apps/backend`, no secrets |

Post-design re-check: no violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-card-swipes-table/
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
│   ├── models.py         # + CardSwipe; - CardResponse and Card.responses (Decision enum stays)
│   ├── schemas.py        # CardResponseOut gets created_at; mapping helper decision <-> bool
│   ├── card_service.py   # + record_swipe(), CardNotFoundError, AlreadyAnsweredError
│   ├── routes.py         # POST /card/{user_id} implemented (201 / 404 / 409 / 422)
│   └── recommender.py    # reads history and exclusions from CardSwipe
└── tests/
    ├── test_card_swipes.py       # NEW: saving, rejection, race, timestamp, restart tests
    ├── test_recommendations.py   # helper `answer` writes CardSwipe rows
    └── test_cards.py             # POST tests updated: no longer 501
```

**Structure Decision**: Keep the flat layout and put the write logic in the existing
`card_service.py` next to `get_next_card`, so the route stays thin. No new module is needed.

## Complexity Tracking

No constitution violations; nothing to justify.
