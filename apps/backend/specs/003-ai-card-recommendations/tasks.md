---

description: "Task list for AI Card Recommendations"
---

# Tasks: AI Card Recommendations

**Input**: Design documents from `specs/003-ai-card-recommendations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested in the spec; the plan includes offline tests (Jev is faked with `httpx.MockTransport`, no real network or key), listed per story.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend/`.
Keep the existing flat `app/` layout; reuse `CardFetchResponse` and `ErrorResponse` from
app/schemas.py unchanged; no new tables. Never commit a real API key.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup

- [ ] T001 Move `httpx` from the dev dependency group to runtime dependencies in pyproject.toml (`uv remove --dev httpx && uv add httpx`), then run `uv sync`
- [ ] T002 [P] Append placeholder-only Jev settings to .env.example: `OPENCODE_API_KEY=` (empty), `JEV_MODEL=jev-1.13-free`, `JEV_URL=https://opencode.ai/zen/v1/systemone`, `JEV_TIMEOUT_SECONDS=8`, each with a short Polish comment; no real values

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Settings, the Jev HTTP client and shared test helpers needed by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add to `Settings` in app/config.py: `opencode_api_key: SecretStr | None = None`, `jev_model: str = "jev-1.13-free"`, `jev_url: str = "https://opencode.ai/zen/v1/systemone"`, `jev_timeout_seconds: float = 8.0` (depends on T001)
- [ ] T004 [P] Create app/jev_client.py: `class JevError(Exception)`; `class JevClient` with `__init__(self, api_key: str | None, model: str, url: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None)` and `async def score_interest(self, state: dict, question_ids: list[str]) -> dict[str, float]` that raises `JevError` when there is no api key, and otherwise POSTs `{"model", "state", "questions": {id: {"type": "noul", "instructions": "Given the events this user liked and disliked, will this user be interested in the candidate event with this id?"}}}` with header `Authorization: Bearer <key>` using `httpx.AsyncClient(timeout=timeout)`; wrap network errors, timeouts, non-2xx status and invalid JSON in `JevError` (message never contains the key or the state); return only `answers[id]["noul"]` values that are numbers between 0 and 1 for ids that were asked; also add `def get_jev_client() -> JevClient` (FastAPI dependency) building the client from `get_settings()`
- [ ] T005 [P] Add test helpers to tests/conftest.py: `async def add_cards(factory, n)` creating `n` extra `Card` rows (UUID7 ids, valid fields, names such as `"Music event 3"` or `"Sport event 7"` alternating); a `make_jev_client(handler)` that returns a `JevClient(api_key="test-key", ..., transport=httpx.MockTransport(handler))`; and a `jev_override(client)` that sets `app.dependency_overrides[get_jev_client]` (cleared by the existing teardown) (depends on T004)
- [ ] T006 [P] Create tests/test_jev_client.py: with `MockTransport` assert (1) the request goes to the configured URL with `Authorization: Bearer test-key` and a body with `model`, `state` and one `noul` question per id; (2) valid answers are returned as `{id: probability}`; (3) values that are not numbers in 0..1 and ids that were not asked are dropped; (4) HTTP 500, `httpx.ReadTimeout`, invalid JSON and a missing api key each raise `JevError`; (5) `str(JevError)` never contains `test-key` (depends on T004)

**Checkpoint**: Settings, client and helpers exist; client tests pass

---

## Phase 3: User Story 1 - Get 10 recommended cards for a user (Priority: P1) 🎯 MVP

**Goal**: `GET /card/recommendations/{user_id}` returns 10 cards chosen by Jev from up to 50 random unanswered cards, using the user's right/left history.

**Independent Test**: With 60 unanswered cards and a faked Jev, one request returns exactly 10 distinct unanswered cards in Jev's ranking order.

- [ ] T007 [US1] Create app/recommender.py with `async def get_recommendations(session: AsyncSession, jev: JevClient, user_id: uuid.UUID) -> list[Card]`: (a) candidates = `select(Card)` excluding every `card_id` in the user's `card_responses`, `order_by(func.random()).limit(50)`; return `[]` when none; (b) history = the user's answered cards joined with `CardResponse.decision`, split into `liked` (`Decision.RIGHT`) and `disliked` (`Decision.LEFT`); (c) when the history is empty skip Jev and return the first 10 candidates; (d) state = `{"liked": [...], "disliked": [...], "candidates": [...]}` where every item is `{"id", "event_name", "description" trimmed to 150 characters, "price", "address"}` and the user id is never included; keep the serialised state under about 20,000 estimated tokens (4 characters per token, limit 32,000) by shuffling and trimming history items; (e) call `jev.score_interest(state, [str(c.id) for c in candidates])`; (f) rank candidates by probability descending, ties broken by the random draw order, return the first 10 (a card list of 0 to 10 distinct cards, all from the candidate pool); log `jev_scored` with the counts only (depends on T003, T004)
- [ ] T008 [US1] Add `GET /card/recommendations/{user_id}` to app/routes.py: `operation_id="card_recommendations"`, summary "Get up to 10 recommended cards for a user", description from contracts/api.md, path param `user_id: UserId`, dependencies `session: Annotated[AsyncSession, Depends(get_session)]` and `jev: Annotated[JevClient, Depends(get_jev_client)]`, `response_model=list[CardFetchResponse]`, documented `responses` for 422 (`ErrorResponse`); return `[CardFetchResponse.model_validate(c) for c in cards]`; keep the function thin (depends on T007)
- [ ] T009 [US1] Create tests/test_recommendations.py with: (1) 60 unanswered cards, user has 2 right and 2 left answers, fake Jev gives probability 0.9 to "Music" cards and 0.1 to "Sport" cards: response has exactly 10 distinct cards, all "Music", none answered by the user; (2) the captured Jev request contains 50 questions, `liked`/`disliked`/`candidates` lists, no user id string anywhere in the body and no api key in the body; (3) user with no answers: 10 cards returned and the fake Jev handler is called 0 times; (4) `GET /card/recommendations/not-a-uuid` returns 422 with a string `detail` and Jev is not called (depends on T005, T008)

**Checkpoint**: User Story 1 works on its own (MVP)

---

## Phase 4: User Story 2 - Works with few cards and never fails on small data (Priority: P2)

**Goal**: Fewer than 50 (or 10, or 0) usable cards never cause an error.

**Independent Test**: With 7, 6 and 0 unanswered cards the endpoint returns 7, 6 and `[]` with status 200.

- [ ] T010 [US2] Add tests to tests/test_recommendations.py: (1) 30 unanswered cards with history: 10 cards returned and the Jev request has 30 questions; (2) 6 unanswered cards: all 6 returned, 200; (3) user answered every card: `[]` with 200 and Jev not called; (4) 60 cards: the Jev request has exactly 50 questions (depends on T009)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - A bad AI answer never breaks or pollutes the result (Priority: P3)

**Goal**: Jev failures or invalid answers still give the user a valid list.

**Independent Test**: With Jev returning HTTP 500, the user still receives 10 valid candidate cards.

- [ ] T011 [US3] Make app/recommender.py resilient: catch `JevError` from `score_interest` and use the first 10 random candidates, logging `jev_failed` with only the reason class (never the key, state or card text); ignore returned ids that are not in the candidate set; candidates without a valid score are appended after the scored ones in random order until there are 10; remove duplicates; cap the list at 10 (depends on T007)
- [ ] T012 [US3] Add tests to tests/test_recommendations.py: Jev returning HTTP 500, raising `httpx.ReadTimeout`, returning invalid JSON, and a client without api key each yield 10 candidate cards with status 200; Jev answers covering only 3 of 50 candidates yield 10 cards with those 3 first; Jev answers containing an unknown id and a value of 1.7 are ignored; captured stdout (`capsys`) never contains the test api key; the unknown card id never appears in the response (depends on T011, T010)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T013 Run `uv run pytest` and confirm every test passes, including earlier tests for `/card/new/{user_id}`, `/card/{user_id}` and CORS (spec FR-012)
- [ ] T014 [P] Follow specs/003-ai-card-recommendations/quickstart.md against `uv run fastapi dev app/main.py`: with no key confirm the random fallback; if a real `OPENCODE_API_KEY` is available (local `.env` only), confirm Jev is reached with 50 questions in one request and note the result in the PR; delete the local `app.db` and `.env` afterwards
- [ ] T015 [P] Confirm no secret is committed: `git grep -n -i "opencode_api_key"` shows only the setting name, `.env.example` (empty value), tests with the fake key `test-key` and docs; `git status` shows no `.env`, `app.db` or `__pycache__`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish.
- T003 needs T001. T004 is independent of T003. T005 and T006 need T004.
- US1 needs T003, T004 and the T005 helpers; US2 only adds tests on top of US1; US3 modifies
  app/recommender.py after US1 (same file, run sequentially).
- app/recommender.py, app/routes.py and tests/test_recommendations.py are shared files: edit them one task at a time.

## Parallel Opportunities

- Phase 1: T002 alongside T001.
- Phase 2: T004 alongside T003; then T005 and T006 together.
- Phase 6: T014 and T015.

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + User Story 1 (10 cards ranked by Jev, with the cold-start shortcut).
- Then User Story 2 (small-data tests) and User Story 3 (failure handling), then Polish.
- Commit and push to `feature/rec_algorithm` at the end of every turn.
