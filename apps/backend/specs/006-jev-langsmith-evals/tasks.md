---

description: "Task list for basic Jev checks in LangSmith"
---

# Tasks: Basic Jev Checks in LangSmith

**Input**: Design documents from `specs/006-jev-langsmith-evals/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/jev-check.md, quickstart.md

**Tests**: Included. The checks are developer tooling that talks to two paid or limited services, so the
rules that protect those limits (one request per situation, nothing sent when a key is missing, never run
by `pytest`) can only be trusted if offline tests prove them. The real Jev and LangSmith run is manual.

**Organization**: Tasks are grouped by user story. All paths are relative to `apps/backend`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2 or US3, from spec.md

## Ground rules for every task

- Add only `scripts/jev_check.py`, `scripts/jev_check_cases.json` and `tests/test_jev_check.py` (plus the
  docs of this feature). Do not edit anything under `app/`, `pyproject.toml`, `.env.example`, the
  frontend or CI. Reuse `JevClient`, `get_settings()` and `build_tracing_client()` as they are.
- The script calls the plain `JevClient`, never `get_jev_client()` or `TracedJevClient` (research R2), so
  there is exactly one trace per situation and none in the production project.
- At most one Jev request and one LangSmith trace per situation: no retries, no repetitions, no loops
  (FR-006). Evaluator tracing stays off.
- Situations are invented. No user identifier, location, saved choices, real swipe history or real card.
  Never print or send a key; keys only come from the environment (FR-012, FR-013).
- Python 3.11, comments explain why, flat layout (constitution v1.1.0). Tests use no network and no real
  key; the `_monitoring_off` fixture in `tests/conftest.py` already keeps LangSmith off.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The two new files in `scripts/`. No dependency to add (`langsmith` is already there).

- [X] T001 [P] Create `scripts/jev_check_cases.json` with 8 invented situations in the format of `contracts/jev-check.md` (`name`, `liked`, `disliked`, `candidates`, `expected`; each card only `name` and `description`, English text): for example a metal fan, a jazz fan, a family with kids, a student wanting something free, a sports fan, an art lover, a quiet board-games person and an outdoor lover. Each has 2 or 3 candidates and one obviously right `expected` that a person would agree with at once; names unique; no real person, place or user data (FR-001, FR-013)
- [X] T002 [P] Create `scripts/jev_check.py` with the module docstring (what it does, the two commands from the contract, exit codes 0/1/2), the constants `CASES_PATH` (next to the file), `DATASET_NAME = "spotted-jev-checks"`, `EXPERIMENT_PREFIX = "jev-check"`, `MIN_CASES = 5`, `MAX_CASES = 10`, and an empty `main()` guarded by `if __name__ == "__main__": raise SystemExit(main())`; confirm `uv run python -c "import scripts.jev_check"` works from `apps/backend` (a namespace package through `pythonpath = ["."]`, no network, no key needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure, offline building blocks all three stories use: loading and validating the file,
building the state Jev receives, and the pass rule.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `scripts/jev_check.py` add `load_cases(path)` returning the situations or raising `CaseError(message)` on the first problem, with a message that names the situation (or the file) and never a value of a key. Rules, quoted from data-model.md: the file holds 5 to 10 situations (`MIN_CASES`, `MAX_CASES`); `name` is required, unique and short; `liked` and `disliked` may be empty; `candidates` is required with at least 2 cards whose names are unique within the situation; `expected` is required and must equal the `name` of one candidate; a card is `{"name": string, "description": string}` and nothing else; any other key on a situation or on a card is rejected (it is how real user data would sneak in) (FR-010, FR-013)
- [X] T004 [P] In `scripts/jev_check.py` add `build_state(case)` returning `{"liked": [...], "disliked": [...], "candidates": [...]}` where every card becomes `{"id", "event_name", "description", "price": None, "address": None}` with `id` equal to `c1`, `c2`, ... within the situation (liked, disliked and candidates numbered separately by prefix so ids never collide, for example `l1`, `d1`, `c1`), no `choices` key and nothing identifying a user, plus `expected_id(case)` returning the id of the expected candidate and `candidate_names(case)` mapping ids to names, per data-model.md "How a situation becomes the request"
- [X] T005 [P] In `scripts/jev_check.py` add the pure pass rule `top_candidate_wins(scores, expected_id)` returning `(passed: bool, comment: str)`: passes only if the expected candidate has a score and it is strictly greater than the score of every other candidate that has one; a tie fails with a comment naming the tie, a missing expected score fails with the comment `no score for the expected candidate`; otherwise the comment says which candidate was on top (FR-003, research R5)

**Checkpoint**: `uv run python -c "from scripts.jev_check import load_cases; print(len(load_cases('scripts/jev_check_cases.json')))"` prints 8.

---

## Phase 3: User Story 1 - Check on demand that Jev still picks sensible cards (Priority: P1) 🎯 MVP

**Goal**: One command runs every situation against the real Jev once, prints a pass/fail/error line per
situation and a total, and records the run in LangSmith as one experiment.

**Independent Test**: With a fake Jev and a fake LangSmith client, run the situations and check the output,
the number of requests and the arguments of the experiment; then do the real run (quickstart step 4).

### Tests for User Story 1 (write first, they must fail before T012) ⚠️

- [X] T006 [P] [US1] In `tests/test_jev_check.py` write `test_pass_rule`: the expected candidate on top passes; a tie fails and the comment says so; a missing expected score fails; a missing score for another candidate is ignored; scores that differ by 0.02 in the right order pass (no minimum gap)
- [X] T007 [US1] In `tests/test_jev_check.py` write `test_state_has_the_recommender_shape_and_no_user_data`: for each case of the real `scripts/jev_check_cases.json`, `build_state(case)` has exactly the keys `liked`, `disliked`, `candidates`, every card has exactly the keys of `app.recommender._compact(card)` output (`id`, `event_name`, `description`, `price`, `address`), the ids are unique across the whole state, and the serialized state contains no `choices` key
- [X] T008 [US1] In `tests/test_jev_check.py` write `test_one_request_per_situation_and_errors_do_not_stop_the_run`: run all situations through the local runner (T012) with a plain `JevClient` on `httpx.MockTransport` that counts requests, answers 200 with scores in which the expected candidate wins, except one situation (identified by a candidate id in the request body) that answers 429; assert exactly one request per situation, that situation has status `error` with reason `http_429`, all the others `passed`, and no retry happened
- [X] T009 [US1] In `tests/test_jev_check.py` write `test_report_lines_and_total`: `format_report(results)` for one passed, one failed and one errored result gives the lines and the summary of `contracts/jev-check.md` (`PASS`, `FAIL`, `ERROR`, `passed 1 of 2 (1 error)` where errors are not in the denominator), the scores of a passed or failed situation appear, and the exit code function returns 0 only when everything passed and 1 otherwise
- [X] T010 [US1] In `tests/test_jev_check.py` write `test_experiment_arguments_and_dataset_sync`: with a recording stand-in for the LangSmith client and `evaluate` patched in the `scripts.jev_check` module, assert that `evaluate` is called once with `num_repetitions=1`, `max_concurrency=0`, `disable_evaluator_tracing=True`, `experiment_prefix="jev-check"`, the given client, exactly one evaluator, and `data` holding exactly one example per situation (not the dataset name); and that `sync_dataset` creates the dataset `spotted-jev-checks` when missing, creates only the examples that are absent or changed, leaves unchanged ones alone, deletes examples whose id is not in the file, and gives each situation the same id on every run (`uuid5` of its name) (FR-005, FR-006, research R4)

### Implementation for User Story 1

- [X] T011 [US1] In `scripts/jev_check.py` add `async run_situation(jev, case)` returning a `CheckResult(situation, status, scores, reason, seconds)` per data-model.md: it calls `jev.score_interest(build_state(case), ids)` once, maps the returned ids back to candidate names, uses `top_candidate_wins` to give `passed` or `failed` with its comment, and on `JevError` returns status `error` with the error message as the reason (the safe reason code) without retrying; any other exception is not swallowed
- [X] T012 [US1] In `scripts/jev_check.py` add `run_local(jev, cases)` that runs the situations one after another with `asyncio.run(run_situation(...))` for each and returns the list of results, and `format_report(results)` plus `exit_code(results)` exactly as in `contracts/jev-check.md` (one line per situation, the summary `passed X of Y (N error[s])`, 0 when every situation passed, otherwise 1)
- [X] T013 [US1] In `scripts/jev_check.py` add `sync_dataset(client, cases)`: create the dataset `DATASET_NAME` if `client.has_dataset` is false, read its examples with `client.list_examples`, upsert only the situations whose inputs (the situation without `expected`) or outputs (`{"expected": name}`) differ using `client.create_examples` with `examples=[{"id": uuid5(name), "inputs": ..., "outputs": ...}]`, delete examples whose id is not in the file with `client.delete_examples`, and return the example objects that belong to the file's situations, in file order (so `evaluate` never runs anything else)
- [X] T014 [US1] In `scripts/jev_check.py` add `run_with_langsmith(client, jev, cases)`: call `sync_dataset`, then `langsmith.evaluate` with `target` (a function of the example inputs that rebuilds the situation, runs `run_situation` once with `asyncio.run`, stores the `CheckResult` in a local dict keyed by situation name and returns `{"scores": by_name}`; a `JevError` is stored as the result and then re-raised so the LangSmith run shows as errored), `data` = the example list from T013, `evaluators=[winner_on_top]` where `winner_on_top` returns `{"key": "winner_on_top", "score": 1 or 0, "comment": the scores and comment}` using `top_candidate_wins`, `experiment_prefix=EXPERIMENT_PREFIX`, `client=client`, `max_concurrency=0`, `num_repetitions=1`, `disable_evaluator_tracing=True`, `error_handling="log"`; return the results from the local dict in file order plus the experiment name (research R1, R6; verify in the live run that an errored target is recorded and does not stop the others)
- [X] T015 [US1] In `scripts/jev_check.py` fill `main()` for the normal run: build the plain `JevClient` from `get_settings()` (`opencode_api_key`, `jev_model`, `jev_url`, `jev_timeout_seconds`; never `get_jev_client()`), build the LangSmith client with `app.monitoring.build_tracing_client(<langsmith key>, <langsmith_endpoint>)`, call `run_with_langsmith`, print `format_report`, then `LangSmith experiment: <name> (dataset spotted-jev-checks)`, and return `exit_code(results)`; key checks and the upload-failure fallback come in US2

**Checkpoint**: T006-T010 pass; User Story 1 works with fakes, and the real run (quickstart step 4) can be done.

---

## Phase 4: User Story 2 - The check never runs by accident or burns the limits (Priority: P1)

**Goal**: The command is on demand only, refuses to start without both keys, sends nothing when something is
wrong, and keeps the verdict when LangSmith fails.

**Independent Test**: Run the offline suite with and without keys and see no evaluation; start the command
with each key missing and see exit 2 with nothing sent; make LangSmith preparation fail and see the report.

### Tests for User Story 2 (write first) ⚠️

- [X] T016 [P] [US2] In `tests/test_jev_check.py` write `test_missing_keys_stop_before_anything_is_sent`: for each of `OPENCODE_API_KEY` and `LANGSMITH_API_KEY` missing or empty (use `Settings(_env_file=None, ...)` patched into `get_settings`), `main([])` returns 2, the message names that variable, and a Jev transport that fails the test if used, a LangSmith client factory and `evaluate` that fail the test if called, prove nothing was sent (FR-008)
- [X] T017 [US2] In `tests/test_jev_check.py` write `test_keys_never_appear_in_the_output`: set the Jev key to `MARKER-JEV-KEY` and the LangSmith key to `MARKER-LS-KEY` in the patched settings, run `main([])` with fakes through a normal run, a Jev error run and a LangSmith failure run, and assert neither marker appears in the captured stdout or stderr (FR-012)
- [X] T018 [US2] In `tests/test_jev_check.py` write `test_langsmith_failure_still_prints_the_report`: make the LangSmith client factory (or `sync_dataset`) raise `ConnectionError` before any call; `main([])` still prints one line per situation and the summary, ends with `LangSmith upload failed: ConnectionError`, makes exactly one Jev request per situation, and returns the exit code of the results; a second case makes `client.flush` raise and expects the same last line after the report (FR-014, research R6)
- [X] T019 [US2] In `tests/test_jev_check.py` write `test_check_uses_the_plain_client_and_is_never_collected`: with a LangSmith key set, the Jev client the script builds has exactly the type `JevClient` (not `TracedJevClient`), so no trace goes to the production project (FR-009, research R2); `import scripts.jev_check` needs no key and makes no network call; `pyproject.toml` has `testpaths = ["tests"]` and no file under `tests/` is named so that it runs the script (FR-007)

### Implementation for User Story 2

- [X] T020 [US2] In `scripts/jev_check.py` add `require_keys(settings)` that checks, in this order after the file check, `opencode_api_key` then `langsmith_api_key`, and on a missing or empty one prints `missing OPENCODE_API_KEY` or `missing LANGSMITH_API_KEY` to stderr and makes `main` return 2 before any client, dataset or request exists; make `main` run `load_cases` first and return 2 with the `CaseError` message, so the order is: file, Jev key, LangSmith key (research R7)
- [X] T021 [US2] In `scripts/jev_check.py` make `main` survive a failing LangSmith (research R6): wrap creating the client and `run_with_langsmith` so that an exception raised before any situation ran is caught, one line `LangSmith upload failed: <exception class name>` (never the message, it may quote a URL or key) is remembered, and the same situations run once through `run_local`; after a successful `run_with_langsmith` call `client.flush()` in its own `try/except` that remembers the same line; print the report first and the remembered line last
- [X] T022 [US2] In `scripts/jev_check.py` make sure printing can never leak a key: print only situation names, scores, reason codes and the experiment name, and replace the text of any unexpected exception by its class name in every message the script prints

**Checkpoint**: T016-T019 pass; the command cannot start without both keys, never uses the traced client and keeps the verdict when LangSmith fails.

---

## Phase 5: User Story 3 - Add or change a situation in one place (Priority: P3)

**Goal**: Adding a situation is one entry in one file; a malformed one is named before anything is sent;
a dry run lets a person write one without keys.

**Independent Test**: Add an entry to a temporary copy of the file and see it evaluated; break one rule at a
time and see the situation named; run `--dry-run` with no keys.

### Tests for User Story 3 (write first) ⚠️

- [X] T023 [P] [US3] In `tests/test_jev_check.py` write `test_the_shipped_file_is_valid`: `load_cases` on `scripts/jev_check_cases.json` returns between 5 and 10 situations with unique names, and every situation has exactly the documented fields (FR-001)
- [X] T024 [US3] In `tests/test_jev_check.py` write a parametrized `test_malformed_cases_are_named` that writes a temporary file for each broken rule and expects `CaseError` whose message names the situation: duplicate situation name, fewer than 2 candidates, duplicate candidate name, `expected` not among the candidates, missing `expected`, an unknown key on the situation, an unknown key on a card (for example `user_id`), a card without `description`; plus file-level cases (fewer than 5 situations, more than 10, not valid JSON), where the message names the file; and a check that the message never contains the value of an unknown key
- [X] T025 [US3] In `tests/test_jev_check.py` write `test_a_new_entry_is_evaluated_like_the_others`: copy the shipped file to `tmp_path`, append one valid situation (the file then still has at most 10 situations, so remove one first if needed), run `run_local` with a Jev stub on the loaded cases, and assert the new situation appears in the results and in `sync_dataset`'s example list with its own stable id and no change to any other code (SC-006)
- [X] T026 [US3] In `tests/test_jev_check.py` write `test_dry_run_needs_no_keys_and_sends_nothing`: with both keys missing, `main(["--dry-run"])` returns 0, prints each situation name and `dry run, nothing sent`, and a Jev transport, LangSmith factory and `evaluate` that fail the test if used prove nothing was sent; with a broken file it returns 2 naming the situation

### Implementation for User Story 3

- [X] T027 [US3] In `scripts/jev_check.py` add the `--dry-run` flag with `argparse` (`main(argv=None)` takes the argument list so tests can call it): load and validate the file, print one line per situation (its name, the number of liked, disliked and candidate cards, the expected candidate) and `dry run, nothing sent`, return 0 without reading any key, building any client or sending anything; a `CaseError` prints its message to stderr and returns 2 (FR-010)

**Checkpoint**: T023-T026 pass; all three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T028 Run `uv run pytest` and `uv run ruff check app tests scripts` in `apps/backend` and fix everything they report; also run `uv run pytest` once with `OPENCODE_API_KEY=dummy LANGSMITH_API_KEY=dummy LANGSMITH_ENDPOINT=http://127.0.0.1:9` exported and confirm it passes, makes no upload attempt and does not run the check (FR-007, SC-003)
- [X] T029 Prove that nothing else changed: `git diff origin/main --stat` lists only `scripts/jev_check.py`, `scripts/jev_check_cases.json`, `tests/test_jev_check.py` and files under `specs/006-jev-langsmith-evals/`; `git diff origin/main -- app pyproject.toml uv.lock .env.example` is empty; `git grep -nE "lsv2_(pt|sk)_[A-Za-z0-9]{10,}"` returns nothing (FR-011, FR-012)
- [ ] T030 Manual, needs the real keys exported in the shell only (never written to a file): run quickstart.md steps 2 to 6 (`--dry-run`, missing keys, a real run, a second run, LangSmith unreachable), count the traces in LangSmith (N situations, N traces, no `evaluators` project, no new run in `spotted-jev`), check the account's usage page for the monthly trace allowance quoted in research R8, confirm that an errored Jev call is recorded as an errored run without stopping the others (research R1), and record the results in section 7 of quickstart.md; if `error_handling="log"` does not behave that way, add a new task with its own test instead of changing the rules above
- [ ] T031 Manual, security: the keys used in step T030 were pasted into the chat earlier; rotate the LangSmith key and the Jev key, keep the new ones only in `.env` and in Vercel, and check `git grep -n "lsv2_"` returns nothing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: starts immediately; T001 and T002 are independent files.
- **Foundational (Phase 2)**: needs T002; T003 first (the others do not depend on it), T004 and T005 in parallel with it.
- **User Stories (Phase 3+)**: all need Phase 2.
- **Polish (Phase 6)**: needs the stories you want to ship. T030 and T031 need the real keys.

### User Story Dependencies

- **US1 (P1)**: after Phase 2; no dependency on other stories. T015 is the real-run MVP.
- **US2 (P1)**: after Phase 2; its tests use the runner of US1 (T012, T014, T015), so its implementation
  (T020 to T022) comes after T015, but the test file work (T016 to T019) can be written while US1 is built.
- **US3 (P3)**: needs `load_cases` (T003) and `run_local`/`sync_dataset` (T012, T013) for T025; `--dry-run`
  (T027) goes after `main` exists (T015).

### Within Each Story

- Tests first and failing, then implementation. All tasks in `scripts/jev_check.py` edit one file and run
  one after another in their order; all tests are in `tests/test_jev_check.py` and are written one after
  another; only the first test task of each story is marked [P] where the file is not yet being edited.

### Parallel Opportunities

- T001 and T002; T004 and T005 (with T003).
- T006, T016 and T023 (the first test of each story) once Phase 2 is done, if written by different people
  into separate temporary files and merged.

---

## Parallel Example: Phase 1 and the start of Phase 2

```text
Task: "T001 [P] Create scripts/jev_check_cases.json with 8 invented situations"
Task: "T002 [P] Create scripts/jev_check.py skeleton and constants"
Task: "T004 [P] build_state, expected_id, candidate_names in scripts/jev_check.py"
Task: "T005 [P] top_candidate_wins in scripts/jev_check.py"
```

---

## Implementation Strategy

### MVP First (User Story 1, then User Story 2)

1. Phases 1 and 2 (T001 to T005): the pure parts exist and are testable offline.
2. Phase 3 (T006 to T015): a real run is possible. Do not run it for real until T020 to T021 exist, because
   without the key checks and the fallback a mistake wastes the limits.
3. Phase 4 (T016 to T022): both P1 stories together are the real MVP.

### Incremental Delivery

1. Setup, Foundational, then US1 with fakes.
2. US2: protections proven by tests, then the first real run (T030).
3. US3: `--dry-run` and the file rules, then the rotation of the keys (T031).

---

## Notes

- Run the command as a module, `uv run python -m scripts.jev_check` (the commands in T002 and in the contract were corrected during T002/T015): `python scripts/jev_check.py` cannot import `app`.
- 31 tasks: Setup 2, Foundational 3, US1 10, US2 7, US3 5, Polish 4.
- Never commit a real key. T031 is part of the feature, not an afterthought.
- A real run uses one Jev request and one LangSmith trace per situation (8 in the first version); do not
  run it in a loop while testing.
