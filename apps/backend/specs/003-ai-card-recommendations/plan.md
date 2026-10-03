# Implementation Plan: AI Card Recommendations

**Branch**: `feature/rec_algorithm` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-ai-card-recommendations/spec.md`

## Summary

Add `GET /card/recommendations/{user_id}`. The backend draws up to 50 random cards the user has not
answered, loads the user's earlier answers (right = interested, left = not interested), and asks
TypeSafe's Jev model (called through OpenCode, `POST https://opencode.ai/zen/v1/systemone`) one
yes/no question per candidate ("will this user be interested?"). Candidates are ranked by Jev's
probability and the top 10 are returned. Any Jev failure falls back to 10 random candidates, so the
endpoint never errors on AI problems. No new tables. Decisions are in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**: FastAPI, SQLAlchemy 2.x async, aiosqlite, Pydantic v2 +
pydantic-settings, structlog, uuid6 (all present); `httpx` moves from dev to runtime dependencies
(async HTTP client for Jev)

**Storage**: Existing SQLite (`cards`, `card_responses`); read-only for this feature

**Testing**: pytest + pytest-asyncio + httpx `MockTransport` (no real network calls in tests)

**Target Platform**: Linux server / developer machines

**Project Type**: web-service (backend only)

**Performance Goals**: recommendations in under 10 s for 95% of requests (SC-005); Jev itself
answers in roughly 70 to 500 ms

**Constraints**: AI errors must never surface as errors; secrets only from settings; Jev context
limit 32,000 tokens (state + questions); keep the flat `app/` layout

**Scale/Scope**: 1 endpoint, 2 new modules, up to 50 candidates per request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Simplicity in 24 hours | Pass | One endpoint, one external call, no new tables |
| II. Data legality | Pass | Only our own card data is sent; no scraping |
| III. Privacy | Pass | The user id is never sent to Jev; only card details and decisions; nothing stored |
| IV. AI under human control and code | Pass | Amended to allow Jev recommendations: typed output only, answers validated against the candidate pool, nothing stored, random fallback, no user id sent, key only in `.env` |
| Quality and workflow rules (v1.1.0) | Pass | Modular files, secrets only in `.env`, branch `feature/rec_algorithm`, changes in `apps/backend` (plus the requested `docs/ARCHITECTURE.md`) |

Post-design re-check: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-card-recommendations/
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
├── pyproject.toml          # httpx moves to runtime dependencies
├── .env.example            # + OPENCODE_API_KEY, JEV_* placeholders
├── app/
│   ├── config.py           # + opencode_api_key, jev_model, jev_url, jev_timeout_seconds
│   ├── jev_client.py       # NEW: JevClient.score_interest(state, question_ids) -> {id: probability}
│   ├── recommender.py      # NEW: candidates, history, ranking, fallback (get_recommendations)
│   └── routes.py           # + GET /card/recommendations/{user_id} (thin)
└── tests/
    └── test_recommendations.py   # NEW: ranking, small data, fallback, validation, no-secret tests
```

**Structure Decision**: Keep the flat layout. The Jev HTTP call (`jev_client.py`) is separate from
the selection logic (`recommender.py`) so each can be tested alone and Jev can be replaced without
touching the route. `schemas.py` is reused unchanged (`CardFetchResponse`, `ErrorResponse`).

## Complexity Tracking

No constitution violations; nothing to justify. (Principle IV was amended to cover Jev recommendations.)
