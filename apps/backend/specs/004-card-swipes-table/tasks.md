---

description: "Task list for Card Swipes Table"
---

# Tasks: Card Swipes Table

**Input**: Design documents from `specs/004-card-swipes-table/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested in the spec; the plan includes tests, listed per story. They use the file-based temporary SQLite fixtures (`db_client`, `session_factory`, `make_database`) from tests/conftest.py.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend/`.
Keep the flat `app/` layout; no new dependency; no migration tool (`create_all` creates the table).
This branch is stacked on the unmerged `feature/rec_algorithm`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup

- [X] T001 Confirm the branch is `feature/card_swipes_table`, run `uv sync` and `uv run pytest` to record that the existing suite passes before changes; no new dependency is needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new table, the response shape and the write logic used by all stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add `CardSwipe` model to app/models.py (table `card_swipes`): `user_id` UUID (`Uuid`) primary key with no foreign key; `card_id` UUID (`Uuid`) primary key with `ForeignKey("cards.id")`; `swipe` Boolean required ("`true` = swipe right (interested), `false` = swipe left (not interested)"); `created_at` `UTCDateTime` required with Python default `lambda: datetime.now(timezone.utc)` ("set by the service at creation; never taken from the client; never changed"); the pair (`user_id`, `card_id`) is the composite primary key; keep the old `CardResponse` for now so the suite stays green
- [X] T003 [P] In app/schemas.py add `created_at: datetime = Field(description="Time the answer was saved, ISO 8601 in UTC")` to `CardResponseOut` (also in its example: `"created_at": "2026-10-03T15:42:10.123456Z"`) and a classmethod `from_swipe(cls, swipe: CardSwipe) -> CardResponseOut` that maps `swipe.swipe` true to `Decision.RIGHT` and false to `Decision.LEFT`; do not add any timestamp field to `CardResponseRequest` (depends on T002 for the import)
- [X] T004 Extend app/card_service.py: `class CardNotFoundError(Exception)`, `class AlreadyAnsweredError(Exception)`, and `async def record_swipe(session, user_id, card_id, decision: Decision) -> CardSwipe` that (a) `await session.get(Card, card_id)` and raises `CardNotFoundError` when missing, (b) adds `CardSwipe(user_id=..., card_id=..., swipe=decision is Decision.RIGHT)`, commits, and refreshes, (c) on `sqlalchemy.exc.IntegrityError` rolls back and raises `AlreadyAnsweredError` ("a repeat is rejected with 409", existing row untouched) (depends on T002)

**Checkpoint**: Table exists and `record_swipe` can be called from a route

---

## Phase 3: User Story 1 - Save the user's swipe when they answer a card (Priority: P1) 🎯 MVP

**Goal**: `POST /card/{user_id}` saves one `card_swipes` row per answer and returns `201`.

**Independent Test**: Answer one card right and another left; two rows exist with `swipe` true and false and a `created_at`.

- [X] T005 [US1] Implement `POST /card/{user_id}` in app/routes.py: add `session: Annotated[AsyncSession, Depends(get_session)]`, call `record_swipe`, map `CardNotFoundError` to `HTTPException(404, "Card not found")` and `AlreadyAnsweredError` to `HTTPException(409, "Card already answered")`, return `CardResponseOut.from_swipe(swipe)` with status 201; update the description to "Saves the user's swipe for a card (`right` stored as true, `left` as false) with the time of saving. A user can answer a card only once."; document responses 404, 409 and 422 (`ErrorResponse`) and remove the 501 entry; log `swipe_saved` with the user id, card id and swipe (depends on T003, T004)
- [X] T006 [US1] Create tests/test_card_swipes.py: (1) answer card A with `right` for user U: status 201, body has `decision == "right"` and a `created_at`, one row in `card_swipes` with `swipe is True`; (2) answer card B with `left`: row with `swipe is False`; (3) one user answering 3 different cards leaves exactly 3 rows (depends on T005)
- [X] T007 [US1] Update tests/test_cards.py: delete `test_card_response_is_not_implemented` and make the two POST validation tests (`unknown decision`, `non-UUID7 card id`) use the `db_client` fixture instead of the local `client` (depends on T005)

**Checkpoint**: User Story 1 works on its own (MVP)

---

## Phase 4: User Story 2 - Records are complete and trustworthy (Priority: P2)

**Goal**: Timestamps are set by the service; bad or repeated answers never change saved data.

**Independent Test**: Unknown card, invalid value and repeat each return an error and leave the table unchanged.

- [X] T008 [US2] Add tests to tests/test_card_swipes.py: unknown card id returns `404` with `{"detail": "Card not found"}` and no row; decision `"up"` and a non-UUID7 `card_id` return `422` with a string `detail` and no row; answering the same card twice (first `right`, then `left`) returns `409` with `{"detail": "Card already answered"}` and the stored row still has `swipe is True` and the original `created_at` (depends on T006)
- [X] T009 [US2] Add tests to tests/test_card_swipes.py: `created_at` is timezone-aware UTC and lies between timestamps taken just before and after the request; a `created_at` of `"2000-01-01T00:00:00Z"` in the request body is ignored; 5 identical answers fired with `asyncio.gather` produce exactly one `201`, four `409` and one row; two different users answering the same card get two rows; answers survive a restart (reopen the database file with `make_database` and read the rows) (depends on T008)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - The rest of the app uses the saved answers (Priority: P3)

**Goal**: Recommendations use `card_swipes`; the old `card_responses` table is gone.

**Independent Test**: Answer cards through POST, request recommendations: those cards are excluded and the AI is told which were liked and disliked.

- [X] T010 [US3] Switch app/recommender.py to `CardSwipe`: exclusion `select(CardSwipe.card_id).where(CardSwipe.user_id == user_id)`; history `select(Card, CardSwipe.swipe).join(CardSwipe, CardSwipe.card_id == Card.id).where(CardSwipe.user_id == user_id)` returning `(card, swipe)` pairs; in `_build_state` a card is "liked" when `swipe` is true and "disliked" when false; remove the now unused `CardResponse` and `Decision` imports (depends on T002)
- [X] T011 [US3] Update tests/test_recommendations.py: change the `answer` helper to write `CardSwipe(user_id=..., card_id=..., swipe=(decision is Decision.RIGHT))` and fix imports; add an end-to-end test where user U answers card A `right` and card B `left` through `POST /card/{U}` and then `GET /card/recommendations/{U}` excludes both cards and the captured Jev request has A in `liked` and B in `disliked`; a user with no swipes still gets 10 cards without calling Jev (depends on T010, T005)
- [X] T012 [US3] Remove `CardResponse` and `Card.responses` from app/models.py (keep the `Decision` enum for the API), delete imports that became unused (`Enum`, `relationship` if unused), and confirm `git grep -n "CardResponse\b\|card_responses" -- app tests` finds nothing but the schema names `CardResponseRequest` and `CardResponseOut` (depends on T010, T011)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 Run `uv run pytest` and confirm every test passes, including the earlier tests for `/card/new/{user_id}`, `/card/recommendations/{user_id}`, `/card/{user_id}` and CORS (spec FR-004 to FR-010)
- [X] T014 [P] Delete any old local `app.db`, then follow specs/004-card-swipes-table/quickstart.md steps 1 to 10 against `uv run fastapi dev app/main.py` (use `sqlite3` or a short Python snippet to read `card_swipes`); delete `app.db` and `.env` afterwards
- [X] T015 [P] Confirm `docs/API.md` matches contracts/api.md (POST response has `created_at`, errors 404 and 409, no 501), `git status` shows no `.env`, `app.db` or `__pycache__`, and no secret was added

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish.
- T002 and T003 in parallel; T004 needs T002. US1 needs T003 and T004. US2 only adds tests on top of US1. US3 needs the model (T002) and the POST endpoint (T005) for its end-to-end test; T012 removes the old model last, after nothing else uses it.
- app/models.py, app/routes.py, tests/test_card_swipes.py and tests/test_recommendations.py are edited by several tasks: do them one at a time.

## Parallel Opportunities

- Phase 2: T002 and T003 together.
- Phase 6: T014 and T015 together.

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + User Story 1 (POST saves the swipe).
- Then User Story 2 (rejections, timestamp, race and persistence tests), then User Story 3 (recommendations on the new table, old table removed), then Polish.
- Commit and push to `feature/card_swipes_table` at the end of every turn.
