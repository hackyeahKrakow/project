# Implementation Plan: Jev Monitoring with LangSmith

**Branch**: `feature/jev_langsmith_monitoring` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-jev-langsmith-monitoring/spec.md`

## Summary

Trace every Jev call made for recommendations in LangSmith, without touching the backend's logic. A new
module `app/monitoring.py` holds `TracedJevClient`, a subclass of `JevClient` that overrides only
`score_interest`: it runs the parent method inside a LangSmith trace and returns its result, or raises
its exception, untouched. The factory `get_jev_client()` returns the traced class when a LangSmith key
is configured and the plain class otherwise, so `JevClient`, `recommender.py` and the routes do not
change and there is no tracing code on the path when the key is absent. Inputs are filtered before
they leave the service (option B: card names and descriptions yes, the user's saved choices never), the
outcome and failure reason are added as metadata, and the upload runs in the SDK's background thread.
Decisions and measurements are in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**: FastAPI, httpx, pydantic-settings, structlog (all present); new: `langsmith`
(0.14.4 at the time of writing)

**Storage**: N/A (no database change; traces live in LangSmith)

**Testing**: pytest + pytest-asyncio; a `langsmith.Client` with a fake HTTP session, no network

**Target Platform**: Linux server, Vercel serverless function in production

**Project Type**: web-service (backend only)

**Performance Goals**: at most 0.1 s added to a recommendations request, also when LangSmith is
unreachable (SC-003); measured overhead of a traced call is about 1 ms

**Constraints**: no change to existing logic (FR-005); monitoring failures never reach the request
(FR-006); off unless a key is set (FR-007); no user id, location, saved-choices content or secret in a
trace (FR-003, FR-004); keep the flat `app/` layout; no new endpoint, table or migration

**Scale/Scope**: 1 new module, 3 optional settings, 1 dependency, 3 test files and a test helper, a small
change to the `get_jev_client()` factory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Simplicity in 24 hours | Pass | One module, one dependency, no endpoint, table or dashboard of our own |
| II. Data legality | Pass | Only our own demo cards and the service's own call data; no scraping |
| III. Privacy | Pass | No user id, location or saved-choices content in a trace; the input filter and a test enforce it |
| IV. AI under human control and code | Pass | Jev's behavior, validation and random fallback are untouched; keys stay in settings, never in the repo |
| Quality and workflow rules (v1.1.0) | Pass | Modular (one responsibility per module), branch `feature/jev_langsmith_monitoring`, changes only in `apps/backend`, only a placeholder key in `.env.example`, asked before guessing (FR-004) |

Post-design re-check: no violations, so Complexity Tracking is empty. One thing to watch: LangSmith is
a third party. The design keeps what it receives to card data and call statistics, which is the line the
privacy principle draws.

## Project Structure

### Documentation (this feature)

```text
specs/005-jev-langsmith-monitoring/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── jev-trace.md
├── checklists/
│   └── requirements.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (apps/backend)

```text
apps/backend/
├── app/
│   ├── monitoring.py     # NEW: TracedJevClient, the input filter, the cached tracing client
│   ├── jev_client.py     # get_jev_client() picks TracedJevClient when a key is set; nothing else changes
│   └── config.py         # + langsmith_api_key, langsmith_project, langsmith_endpoint
├── tests/
│   ├── monitoring_helpers.py       # NEW: fake HTTP session for the tracing client, traced-client builder
│   ├── test_monitoring_traces.py   # NEW (US1): trace content, failures, redaction, one trace per call
│   ├── test_monitoring_safety.py   # NEW (US2): same result, failure isolation, off by default
│   └── test_monitoring_labels.py   # NEW (US3): environment tag, reason codes
├── .env.example          # + empty LANGSMITH_* placeholders
├── pyproject.toml        # + langsmith (uv add langsmith updates uv.lock)
└── specs/005-jev-langsmith-monitoring/
```

`app/recommender.py`, `app/routes.py`, the models and the database stay as they are.

**Structure Decision**: keep the existing flat backend layout and put all tracing code in one new
module, so removing monitoring means deleting that module and the factory branch.

## Complexity Tracking

No violations to justify.
