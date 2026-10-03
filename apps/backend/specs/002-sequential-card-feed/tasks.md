---

description: "Task list for Sequential Card Feed"
---

# Tasks: Sequential Card Feed

**Input**: Design documents from `specs/002-sequential-card-feed/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested in the spec; the plan includes small automated tests, listed per story.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend/`
(constitution: changes only inside `apps/backend`). Keep the existing flat `app/` layout; reuse
`CardFetchResponse` and `ErrorResponse` from app/schemas.py unchanged.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Phase 1: Setup

- [ ] T001 Confirm the working branch is `feature/backend_logic`, run `uv sync`, and confirm no new dependency is needed (FastAPI, SQLAlchemy async, aiosqlite, uuid6, pytest, pytest-asyncio and httpx are already in pyproject.toml)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data and test infrastructure needed by both user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add `UserCardProgress` model to app/models.py (table `user_card_progress`): `user_id` UUID (`Uuid`) primary key with no foreign key; `cards_served` Integer required, default 0, "between 0 and 6 inclusive" enforced with a `CheckConstraint("cards_served >= 0 AND cards_served <= 6")`; use `Mapped[...]`/`mapped_column`, inherit `Base`
- [ ] T003 [P] Create app/seed.py with `SEED_CARDS`, an ordered list of six `Card` definitions (list position + 1 = card number 1 to 6) using fixed UUID7 ids generated once with `uv run python -c "from uuid6 import uuid7; print(uuid7())"` and pasted in as literals; each card MUST have `event_name` (max 200), `color_code` (`#RRGGBB`), `description`, `image_url` (relative path or null), `starts_at` (timezone-aware), optional `ends_at`, `address` (max 300), `lat` (-90 to 90), `lng` (-180 to 180), `price` (>= 0, PLN); contents are original placeholder Krakow student events; also add `async def seed_cards(session)` that inserts only the ids not yet in `cards` (never overwrites) and commits
- [ ] T004 Update `init_db()` in app/init.py to call `seed_cards` (using `session_factory` from app/database.py) after `Base.metadata.create_all`, and log `cards_seeded` with the count (depends on T002, T003)
- [ ] T005 [P] Create tests/conftest.py: pytest fixtures that build an in-memory SQLite async engine (`sqlite+aiosqlite://` with `StaticPool`), create all tables, call `seed_cards`, override the `get_session` dependency of `app.main.app`, and yield an `httpx.AsyncClient` using `ASGITransport`; remove the override on teardown (depends on T002, T003)

**Checkpoint**: Server starts, creates the new table and seeds exactly six cards

---

## Phase 3: User Story 1 - Get the next card in order (Priority: P1) 🎯 MVP

**Goal**: `GET /card/new/{user_id}` returns cards 1 to 6 in order, then "no more cards".

**Independent Test**: For one user id call the endpoint seven times: cards 1 to 6 in order, then `404`.

- [ ] T006 [US1] Create app/card_service.py with `async def get_next_card(session, user_id) -> Card | None`: in one transaction (a) `insert(UserCardProgress).values(user_id=..., cards_served=0).on_conflict_do_nothing()` (SQLite dialect insert), (b) `UPDATE user_card_progress SET cards_served = cards_served + 1 WHERE user_id = :id AND cards_served < 6 RETURNING cards_served`; if no row is returned return `None` without changing anything; otherwise load and return the `Card` whose id is `SEED_CARDS[returned - 1].id`; commit; log `card_served` with the card number (never log anything but the user id and number) (depends on T002, T003)
- [ ] T007 [US1] Add `GET /card/new/{user_id}` to app/routes.py: `operation_id="card_new"`, summary "Get the next card in the fixed sequence", description "Returns the next of six predefined cards (numbered 1 to 6) for this user, in order. The service remembers each user's position, so a card is never returned twice to the same user. After card 6 it returns 404.", path param `user_id: UserId`, `session: AsyncSession = Depends(get_session)`, `response_model=CardFetchResponse`, documented `responses` for 404 (`ErrorResponse`, "No more cards") and 422 (`ErrorResponse`); when the service returns `None` raise `HTTPException(404, detail="No more cards")`; keep the function thin (depends on T006)
- [ ] T008 [US1] Create tests/test_card_new.py: (1) six calls for one user return 6 different cards in seed order with every `CardFetchResponse` field present; (2) the 7th and 8th calls return `404` with `{"detail": "No more cards"}`; (3) `GET /card/new/not-a-uuid` returns `422` with a string `detail` (depends on T005, T007)

**Checkpoint**: User Story 1 works on its own (MVP)

---

## Phase 4: User Story 2 - Progress is remembered per user (Priority: P2)

**Goal**: Each user has their own persistent position; concurrent requests never skip or repeat.

**Independent Test**: Fetch 2 cards for user A, 1 for user B (card 1), then A gets card 3.

- [ ] T009 [P] [US2] Add test to tests/test_card_new.py: user A fetches twice, user B fetches once and receives card 1, then user A's next card is card 3 (FR-006) (depends on T008)
- [ ] T010 [P] [US2] Add test to tests/test_card_new.py: for one user fire 6 requests at once with `asyncio.gather`; the 6 responses are 6 distinct cards (no repeats, none skipped) and a 7th request returns `404` (depends on T008)
- [ ] T011 [P] [US2] Add test to tests/test_card_new.py using a temporary file-based SQLite database (`tmp_path`): fetch 2 cards, dispose the engine and create a new engine and session factory on the same file to simulate a restart, then the next fetch returns card 3 (FR-007) (depends on T008)
- [ ] T012 [P] [US2] Add test to tests/test_card_new.py: calling `seed_cards` twice leaves exactly six rows in `cards` and does not overwrite an edited card (depends on T008)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T013 Run `uv run pytest` and confirm all tests pass, including the earlier tests in tests/test_cards.py, tests/test_health.py and tests/test_cors.py, which prove `GET /card/{user_id}` and `POST /card/{user_id}` still behave as before (FR-011)
- [ ] T014 [P] Run the validation steps in specs/002-sequential-card-feed/quickstart.md against `uv run fastapi dev app/main.py`, including a real restart check, then delete the local `app.db`; confirm `/docs` shows `card_new` with summary, description and example matching contracts/api.md
- [ ] T015 [P] Confirm nothing sensitive or generated is committed: `git status` shows no `.env`, `app.db` or `__pycache__`, and no files changed outside `apps/backend`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → Polish.
- US2 builds on US1's endpoint (the same endpoint, extra guarantees), so it follows US1.
- Foundational: T002 first, then T003 and T005 in parallel (T005 also needs T003), then T004.
- US1: T006 → T007 → T008 (each touches different files but depends on the previous one).
- US2 tests T009 to T012 all edit tests/test_card_new.py, so run them one at a time even though
  they are marked [P] for independence of logic (no shared state between them).

## Parallel Opportunities

- Phase 2: T003 alongside T002; T005 after both.
- Phase 4: tests T009 to T012 are independent test functions that can be written in any order.
- Phase 5: T014 and T015.

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + User Story 1 (cards 1 to 6 in order, then 404).
- Then User Story 2 (per-user progress, concurrency, persistence tests) and Polish.
- Commit and push to `feature/backend_logic` at the end of every turn.
