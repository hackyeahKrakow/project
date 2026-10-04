# Implementation Plan: Basic Jev Checks in LangSmith

**Branch**: `feature/jev_langsmith_tests` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-jev-langsmith-evals/spec.md`

## Summary

A developer-run script, `scripts/jev_check.py`, sends a small fixed list of made-up situations
(`scripts/jev_check_cases.json`, 5 to 10 entries) to the real Jev, one request per situation, and checks
that the expected candidate gets the strictly highest score. The run is recorded in LangSmith as one
experiment over a dataset that mirrors the file, using the SDK's `evaluate` with evaluator tracing off, so
a run costs one trace per situation and nothing more. The script lives outside `app/`, is not collected by
`pytest`, and does not touch the recommender, the routes, `JevClient` or the monitoring module; it reuses
`JevClient` as it is and the tracing client factory from feature 005. Decisions are in
[research.md](research.md).

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**: `langsmith` (present, 0.14.4), `httpx` and `pydantic-settings` (present); nothing
new to install

**Storage**: N/A for our database. LangSmith holds one dataset (the situations) and one experiment per run

**Testing**: pytest + pytest-asyncio for the offline parts (validation, pass rule, error handling, key
checks, fallback); the real Jev and LangSmith run is a manual quickstart step

**Target Platform**: a developer machine or the cloud dev container; never Vercel

**Project Type**: web-service (backend only); the addition is a dev script

**Performance Goals**: a full run in under 2 minutes (SC-001); 8 situations take about 10 to 30 s with the
free model

**Constraints**: at most one Jev request and one trace per situation, no retries, no repetitions (FR-006,
SC-002); no change to existing logic (FR-011); keys only from the environment (FR-012); invented data only
(FR-013); results printed even if LangSmith fails (FR-014); separate from the production project (FR-009)

**Scale/Scope**: 1 script, 1 JSON file, 1 test file, a small set of docs; no change under `app/`, no new
dependency, no new setting

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Status | Note |
|------------------|--------|------|
| I. Simplicity in 24 hours | Pass | One script and one data file, SDK feature used as designed, no pipeline, scheduler or dashboard |
| II. Data legality | Pass | Situations are written by us in our own words; nothing is scraped |
| III. Privacy | Pass | No user id, location, saved choices or swipe history; the situations contain only invented events |
| IV. AI under human control and code | Pass | A person runs it and reads the verdict; Jev is only observed, its validation and fallback are untouched; keys come from `.env` |
| Quality and workflow rules (v1.1.0) | Pass | One responsibility per module, branch `feature/jev_langsmith_tests`, changes only in `apps/backend`, no key in the repo, ambiguities recorded as assumptions |

Post-design re-check: no violations, so Complexity Tracking is empty. One thing to watch: the check
sends the invented situations to two third parties (Jev, LangSmith). That is acceptable only because the
data is invented, so validation also rejects a case that has a field outside the documented ones.

## Project Structure

### Documentation (this feature)

```text
specs/006-jev-langsmith-evals/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── jev-check.md
├── checklists/
│   └── requirements.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (apps/backend)

```text
apps/backend/
├── scripts/
│   ├── jev_check.py            # NEW: load and validate cases, run them, pass rule, report, LangSmith experiment
│   └── jev_check_cases.json    # NEW: the 5 to 10 situations (the only place to add one)
├── tests/
│   └── test_jev_check.py       # NEW: offline tests, no network, no keys
└── specs/006-jev-langsmith-evals/
```

`app/` (recommender, routes, `jev_client.py`, `monitoring.py`, config), `pyproject.toml` and `.env.example`
stay as they are.

**Structure Decision**: dev tooling goes in `scripts/` next to `replace_cards.py`, so it is not part of the
deployed app and is never imported at request time; `pytest` does not collect it because `testpaths` is
`tests` and the file name does not start with `test_`.

## Complexity Tracking

No violations to justify.
