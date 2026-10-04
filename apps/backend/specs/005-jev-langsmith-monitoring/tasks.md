---

description: "Task list for Jev monitoring with LangSmith"
---

# Tasks: Jev Monitoring with LangSmith

**Input**: Design documents from `specs/005-jev-langsmith-monitoring/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/jev-trace.md, quickstart.md

**Tests**: Included. The spec requires them (FR-010 and the measurable success criteria), and the
rule "monitoring must not change behavior" can only be trusted if tests prove it.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2 or US3, from spec.md

## Ground rules for every task

- Do not change `JevClient` (its methods), `app/recommender.py`, `app/routes.py`, the models or the
  database. The only existing code that is edited is `get_jev_client()` in `app/jev_client.py`,
  `app/config.py` (new settings) and `.env.example`.
- A trace never contains the user's identifier, location, the content of the saved choices, the Jev
  key or the LangSmith key. Never write a real key into any file; the key only comes from the
  environment.
- Everything tracing-related lives in `app/monitoring.py`. Python 3.11, flat `app/` layout,
  comments explain why (constitution v1.1.0).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency, settings and placeholders.

- [X] T001 Add the dependency with `uv add langsmith` run in `apps/backend`, which updates `pyproject.toml` and `uv.lock`; confirm with `uv run python -c "import langsmith; print(langsmith.__version__)"`
- [X] T002 [P] Add three optional settings to `class Settings` in `app/config.py`: `langsmith_api_key: SecretStr | None = None`, `langsmith_project: str = "spotted-jev"`, `langsmith_endpoint: str | None = None`, with a comment line saying they control LangSmith traces of the Jev calls and that monitoring is off without a key
- [X] T003 [P] Add placeholders to `.env.example` (comments in Polish like the rest of the file): empty `LANGSMITH_API_KEY=`, `LANGSMITH_PROJECT=spotted-jev`, empty `LANGSMITH_ENDPOINT=`, with a comment that the key lives only in `.env` and in Vercel variables, never in the repository, and that an EU account needs its regional endpoint

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The client class, the factory switch and the test helpers every story needs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create `app/monitoring.py` with (a) a cached `get_tracing_client()` (`functools.lru_cache`) returning `langsmith.Client(api_key=<the secret's value>, timeout_ms=(2_000, 5_000))`, passing `api_url=<langsmith_endpoint>` only when that setting is not empty (so the SDK default applies otherwise), and (b) `class TracedJevClient(JevClient)` whose `__init__` takes the same arguments as `JevClient` plus an optional keyword `tracing_client` (default: `get_tracing_client()`), and whose `score_interest(self, state, question_ids)` for now only does `return await super().score_interest(state, question_ids)`
- [X] T005 [P] In `app/jev_client.py` change only `get_jev_client()`: when `settings.langsmith_api_key` is set, return `TracedJevClient(...)` with the same arguments as the plain client, importing it inside the function to avoid a circular import; otherwise return the plain `JevClient` exactly as today (depends on T004)
- [X] T006 [P] Create `tests/monitoring_helpers.py` with: a `FakeLangSmithSession` that stands in for the HTTP session of `langsmith.Client` (constructed with `session=` and `auto_batch_tracing=False`), records every request it receives (method, url, decoded body) and can be switched to raise `requests.ConnectionError`; `traced_client(handler, session, environment="dev", project="spotted-jev")` returning a `TracedJevClient` whose Jev HTTP goes through `httpx.MockTransport(handler)` as in `make_jev_client` in `tests/conftest.py` and whose tracing client uses the fake session; and `captured_traces(session)` returning the recorded runs as dicts (name, tags, project, metadata, inputs, outputs, error). Confirm the injection really works (research R9) and state the final approach in the module docstring (depends on T004)

**Checkpoint**: `uv run pytest` still passes; with no key set the app behaves exactly as before.

---

## Phase 3: User Story 1 - See every Jev call in LangSmith (Priority: P1) 🎯 MVP

**Goal**: Each Jev call made for recommendations produces one trace with timing, model, counts, outcome,
reason and scores, and with the inputs filtered per option B.

**Independent Test**: With a traced client, run one successful and one failed Jev call and check the
captured traces against contracts/jev-trace.md; then run the recommendations route for a user with and
without answers.

### Tests for User Story 1 (write first, they must fail before T011) ⚠️

- [X] T007 [P] [US1] In `tests/test_monitoring_traces.py` write `test_success_trace`: one call through `traced_client` gives exactly one captured run named `jev.score_interest`, project `spotted-jev`, outputs `{"scores": {...}}` equal to what the client returned, and metadata `outcome == "success"`, `model`, `candidates`, `liked`, `disliked` (integers) and `has_choices` (boolean)
- [X] T008 [US1] In `tests/test_monitoring_traces.py` write a parametrized `test_failure_trace` for the Jev failures `timeout` (an `httpx.TimeoutException`), `http_401`, `network_error` and `invalid_response`: exactly one run with `outcome == "failed"`, `reason` equal to the code, an error on the run, and the same `JevError` with the same message reaching the caller
- [X] T009 [US1] In `tests/test_monitoring_traces.py` write `test_inputs_are_redacted`: use a state whose `choices` contains the marker `MARKER-PRIVATE-CHOICE`, a Jev key `test-key` and a user UUID; assert that none of the three appears anywhere in the whole captured request body, that the inputs hold the candidate cards (id, event_name, description, price, address), the liked and disliked cards as only `id` and `event_name`, and `choices_included == true`
- [X] T010 [US1] In `tests/test_monitoring_traces.py` write `test_one_trace_per_jev_call_and_none_for_cold_start`: through `GET /card/recommendations/{user_id}` using the `db_client` and `session_factory` fixtures and `jev_override(traced_client(...))` from `tests/conftest.py`, a user with swipes produces exactly one trace and a user with no swipes and no saved choices produces none

### Implementation for User Story 1

- [X] T011 [US1] In `app/monitoring.py` add `_redact_inputs(inputs)` that receives `{"model", "state", "question_ids"}` and returns exactly the shape in contracts/jev-trace.md: `{"model": ..., "questions": len(question_ids), "candidates": state["candidates"], "liked": [{"id", "event_name"} ...], "disliked": [{"id", "event_name"} ...], "choices_included": "choices" in state}`; wrap it in `try/except Exception` and return `{"redaction": "failed"}` on any error, never the raw inputs
- [X] T012 [US1] In `app/monitoring.py` implement `TracedJevClient.score_interest`: inside `with tracing_context(enabled=True, client=self._tracing_client)` call an inner async function decorated with `@traceable(name="jev.score_interest", run_type="chain", project_name=<langsmith_project>, process_inputs=_redact_inputs, process_outputs=lambda scores: {"scores": scores})` that takes `(model, state, question_ids)` and returns `await super().score_interest(state, question_ids)`; return the value and let every exception through untouched (build the inner function per call, so `super()` and the settings are read at call time)
- [X] T013 [US1] In `app/monitoring.py`, in the inner function of T012, add the run metadata with `langsmith.run_helpers.get_current_run_tree()`, which is `None` when tracing is off, so check `if run is not None` before every use: set `model`, `candidates`, `liked`, `disliked` and `has_choices` before the call, `outcome="success"` after it, and on `JevError` set `outcome="failed"` and `reason=str(exc)` and re-raise

**Checkpoint**: T007-T010 pass; User Story 1 is fully functional and testable on its own.

---

## Phase 4: User Story 2 - Monitoring never changes how the app behaves (Priority: P1)

**Goal**: Monitoring on, off or broken gives the same results, the same errors and no noticeable delay.

**Independent Test**: Compare plain and traced clients on the same input, break the tracing client,
and check what the factory returns with and without a key.

### Tests for User Story 2 (write first) ⚠️

- [X] T014 [P] [US2] In `tests/test_monitoring_safety.py` write `test_same_result_with_and_without_monitoring`: for the same state and the same Jev stub the plain `JevClient` and the `TracedJevClient` return equal scores, and through `GET /card/recommendations/{user_id}` the two give the same card ids in the same order
- [X] T015 [US2] In `tests/test_monitoring_safety.py` write `test_broken_monitoring_does_not_affect_the_call`: with the fake session raising `requests.ConnectionError` for every request, `score_interest` still returns the same scores, a Jev failure still raises the same `JevError`, and the traced call takes less than 0.1 second longer than the plain one
- [X] T016 [US2] In `tests/test_monitoring_safety.py` write `test_off_without_a_key`: with `get_settings` patched to settings without `langsmith_api_key`, `get_jev_client()` returns an object whose type is exactly `JevClient`; with a key set it returns a `TracedJevClient`; use `Settings(_env_file=None, ...)` so the developer's `.env` cannot interfere
- [X] T017 [US2] In `tests/test_monitoring_safety.py` write `test_missing_run_tree_is_harmless`: patch `app.monitoring.get_current_run_tree` to return `None` and check the call still returns its result (this is the trap found in research R3), and `test_failing_metadata_update_is_harmless`, where `add_metadata` raises and the call still returns its result or its own `JevError`
- [X] T018 [US2] In `tests/test_monitoring_safety.py` write `test_factory_survives_a_broken_tracing_client`: patch `app.monitoring.get_tracing_client` to raise, then `get_jev_client()` with a key set returns a plain `JevClient` and does not raise

### Implementation for User Story 2

- [X] T019 [US2] In `app/monitoring.py` make sure nothing added by monitoring can raise into the caller: wrap every metadata update in `try/except Exception` that only logs at debug level through `app.logger.get_logger` (no secrets, no payloads), keeping the `if run is not None` guard from T013
- [X] T020 [US2] In `get_jev_client()` in `app/jev_client.py` wrap the construction of the traced client in `try/except Exception`: on any error log one warning (`monitoring_disabled`, the error type only) and return the plain `JevClient`

**Checkpoint**: T014-T018 pass; the app's results are identical with monitoring on, off and broken.

---

## Phase 5: User Story 3 - Find failed and slow Jev calls quickly (Priority: P2)

**Goal**: Traces carry an environment tag and filterable outcome and reason, so problems are easy to find.

**Independent Test**: Check the tag and the reason codes in captured traces, then filter a real LangSmith
project by tag and by outcome.

### Tests for User Story 3 (write first) ⚠️

- [X] T021 [P] [US3] In `tests/test_monitoring_labels.py` write `test_environment_tag`: `traced_client(environment="production")` gives runs whose tags are exactly `["production"]`, and the default gives `["dev"]`
- [X] T022 [US3] In `tests/test_monitoring_labels.py` write `test_reason_codes_are_the_documented_ones`: for each failure of `JevClient` (`missing_api_key`, `timeout`, `http_500`, `network_error`, `invalid_response`) the run has `outcome == "failed"` and `reason` equal to that code, and a successful run has no `reason`

### Implementation for User Story 3

- [X] T023 [US3] In `app/monitoring.py` give `TracedJevClient.__init__` an `environment` keyword (default `get_settings().environment`) and pass `tags=[self._environment]` to the `traceable` decorator of T012, so tests can set it and production traffic is told apart from development
- [X] T024 [US3] Manual check, quickstart scenarios 2 and 3: in the LangSmith project filter by the tag and by metadata `outcome = failed`, and confirm the failed call from a wrong Jev key is listed with `reason = http_401` (needs the key in the environment, see T027). Done on 2026-10-04 through the LangSmith API: the tag and the `outcome` metadata filter both returned the expected runs

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 Run `uv run pytest` and `uv run ruff check app tests` in `apps/backend` and fix everything they report
- [X] T026 Prove that no backend logic changed: `git diff origin/main -- app/recommender.py app/routes.py app/models.py` must be empty, and the diff of `app/jev_client.py` must touch only `get_jev_client()` (and its import); run the existing recommendation and Jev tests (`tests/test_recommendations.py`, `tests/test_jev_client.py`) unchanged
- [X] T027 Manual, needs the real key: run quickstart.md scenarios 2 to 5 with `LANGSMITH_API_KEY` exported in the shell only (never written to a file), note which region the key belongs to (set `LANGSMITH_ENDPOINT` if it is the EU one), and record the results in a short note at the end of quickstart.md
- [ ] T028 Manual, Vercel: set `LANGSMITH_API_KEY` (Sensitive), `LANGSMITH_PROJECT` and `ENVIRONMENT=production` in the Vercel project, deploy a preview and run quickstart.md scenario 6; if traces do not arrive, add the bounded flush from research R7 as a new task with its own test and repeat
- [ ] T029 Manual, security: rotate the LangSmith key that was pasted into the chat, put the new one only in `.env` and in Vercel, and check `git grep -n "lsv2_"` returns nothing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: starts immediately; T002 and T003 are independent of each other, T001 first.
- **Foundational (Phase 2)**: needs T001 and T002; T004 first, then T005 and T006 in parallel.
- **User Stories (Phase 3+)**: all need Phase 2.
- **Polish (Phase 6)**: needs the stories you want to ship. T027 to T029 are manual and need the real key.

### User Story Dependencies

- **US1 (P1)**: after Phase 2; no dependency on other stories.
- **US2 (P1)**: after Phase 2; its tests use the traced client built in US1, so its implementation
  tasks (T019, T020) come after T012 and T013, but its test file can be written in parallel with US1's.
- **US3 (P2)**: after US1 (it extends the decorator of T012); its test file is independent.

### Within Each User Story

- Tests first and failing, then implementation. Tasks in `app/monitoring.py` (T011 to T013, T019,
  T023) edit one file, so they run one after another in that order.
- Tasks inside one test file are sequential; only the first test task of each story is marked [P],
  because the three test files are different files.

### Parallel Opportunities

- T002 and T003; T005 and T006.
- T007, T014 and T021 (three different test files) once Phase 2 is done.

---

## Parallel Example: after Phase 2

```text
Task: "T007 [P] [US1] test_success_trace in tests/test_monitoring_traces.py"
Task: "T014 [P] [US2] test_same_result_with_and_without_monitoring in tests/test_monitoring_safety.py"
Task: "T021 [P] [US3] test_environment_tag in tests/test_monitoring_labels.py"
```

---

## Implementation Strategy

### MVP First (User Story 1, then User Story 2)

1. Phases 1 and 2 (T001 to T006): the app still behaves exactly as before.
2. Phase 3 (T007 to T013): traces appear in LangSmith. Stop and validate with quickstart scenario 2.
3. Phase 4 (T014 to T020) before anything goes to production: both P1 stories together are the real
   MVP, because monitoring that could break a request must not ship.

### Incremental Delivery

1. Setup + Foundational, then US1: first visible traces (locally).
2. US2: safety proven by tests, ready for a preview deployment (T028).
3. US3: environment tag and filters, then the manual checks T024, T027, T029.

---

## Notes

- 29 tasks: Setup 3, Foundational 3, US1 7, US2 7, US3 4, Polish 5.
- Never commit a real key. T029 is part of the feature, not an afterthought.

---

## Phase 7: Convergence

**Purpose**: Gaps found by `/speckit-converge` on 2026-10-04 between the code and spec.md, plan.md and the constitution. Same ground rules as above.

- [X] T030 Make the trace metadata unable to raise: in `app/monitoring.py` compute `candidates`, `liked`, `disliked` and `has_choices` inside a small guarded helper (for example `_state_counts(state)` that returns an empty dict on any error and uses `isinstance` or `.get` checks) instead of indexing `state["candidates"]`, `state["liked"]` and `state["disliked"]` as `_annotate` arguments, and add `test_odd_states_behave_like_the_plain_client` to `tests/test_monitoring_safety.py`, where states `{}` and `{"candidates": [], "disliked": []}` give the same scores through `traced_client(...)` as through the plain `JevClient` (currently a `KeyError`) per FR-005, FR-006 and plan R6 (partial) - HIGH
- [X] T031 Make the monitoring tests independent of the developer's environment: add an autouse fixture in `tests/conftest.py` that removes every `LANGSMITH_*` environment variable with `monkeypatch.delenv(..., raising=False)` and clears the caches of `app.config.get_settings` and `app.monitoring.get_tracing_client` before and after each test; change `test_off_without_a_key` in `tests/test_monitoring_safety.py` to build `Settings(_env_file=None, langsmith_api_key=None)`; verify the whole suite passes with `LANGSMITH_API_KEY=dummy-dev-key LANGSMITH_ENDPOINT=http://127.0.0.1:9` exported and makes no upload attempt per FR-010 and US2/AC3 (partial) - MEDIUM
- [X] T032 Label unexpected errors as failures: in `app/monitoring.py` make the `except` in the inner function of `TracedJevClient.score_interest` catch `Exception` (not only `JevError`), set `outcome="failed"` and `reason` to the `JevError` message or, for any other exception, the fixed text `unexpected_error` (never the exception text), and re-raise; add `unexpected_error` to the `reason` list in `contracts/jev-trace.md`; add a test in `tests/test_monitoring_labels.py` where the parent `score_interest` raises `RuntimeError`, the caller gets that same `RuntimeError` and the run has `outcome == "failed"` and `reason == "unexpected_error"` per FR-002 and SC-004 (partial) - LOW
- [X] T033 [P] Add `test_concurrent_calls_get_their_own_traces` to `tests/test_monitoring_traces.py`: 20 calls started together with `asyncio.gather`, each with a different Jev score, give exactly 20 traces whose outputs match the scores each call returned, per the edge case "many recommendation requests at once" (partial) - LOW
- [X] T034 Add `test_failed_jev_call_still_gives_fallback_cards_and_one_trace` to `tests/test_monitoring_traces.py`: through `GET /card/recommendations/{user_id}` with the `db_client` and `session_factory` fixtures, a user with swipes and a Jev stub answering 500 get status 200 with 10 cards and exactly one trace with `outcome == "failed"` and `reason == "http_500"`, per US1/AC2 (partial) - LOW
- [X] T035 Add `test_empty_key_means_off` to `tests/test_monitoring_safety.py`: with `Settings(_env_file=None, langsmith_api_key="")`, which is what copying `.env.example` gives, `get_jev_client()` returns an object whose type is exactly `JevClient`, per FR-007 (partial) - LOW

---

## Phase 8: Convergence

**Purpose**: Gap found by the second `/speckit-converge` run on 2026-10-04. Same ground rules as above.

- [X] T036 Keep the text of unexpected errors out of the stored trace: in `app/monitoring.py` give the client built by `get_tracing_client()` an `anonymizer` (a `langsmith.Client` option that the SDK also applies to a run's error string, passing it as `{"error": <text>}`) that leaves the text of a `JevError(...)` unchanged and replaces the text of any other error by its class name only (for example `RuntimeError`), and returns every other value unchanged; export that function so `tests/monitoring_helpers.py` can pass the same one to the `Client` it builds in `traced_client(...)`; add `test_unexpected_error_text_is_not_stored` to `tests/test_monitoring_safety.py` where the patched parent `score_interest` raises a `RuntimeError` quoting the saved choices (the marker `MARKER-PRIVATE-CHOICE`), asserting the marker is absent from `session.everything_sent()`, the caller still gets that same `RuntimeError`, and a `JevError` such as `http_500` still shows its reason in the trace; remove the sentence about the run's own error field from the `reason` row of `contracts/jev-trace.md`; verify once against the real LangSmith that a forced unexpected error stores only the class name, per FR-003, FR-004 and Constitution III (partial) - HIGH
