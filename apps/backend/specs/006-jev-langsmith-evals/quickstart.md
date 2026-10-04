# Quickstart: validating the Jev checks

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md) | **Contract**: [contracts/jev-check.md](contracts/jev-check.md)

Run from `apps/backend`. Keys come from the environment (`export` in the shell, or `.env`); never write
them into a file that is committed.

## 1. Automated checks (no network, no keys; spec US2, FR-007, SC-003)

```bash
uv run pytest tests/test_jev_check.py
uv run pytest            # whole suite, the Jev check is not run
```

Expected: the file is valid (5 to 10 situations); the pass rule is strict (a tie fails); a failing Jev
gives `error` for that situation only; a malformed situation is named; with a key missing nothing is sent;
if preparing LangSmith raises, the report still prints and one Jev request per situation is made.

## 2. Dry run (no keys; US3/AC2, FR-010)

```bash
uv run python -m scripts.jev_check --dry-run
```

Expected: the situations are listed and "nothing sent". Break one on purpose (set `expected` to a name that
is not a candidate): the command names the situation and exits with 2.

## 3. Missing keys (US2/AC4, FR-008)

```bash
env -u OPENCODE_API_KEY -u LANGSMITH_API_KEY uv run python -m scripts.jev_check
```

Expected: exit 2 naming the missing variable, nothing sent.

## 4. A real run (US1/AC1, SC-001, SC-004)

```bash
export OPENCODE_API_KEY=...        # a Jev key
export LANGSMITH_API_KEY=...       # and LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com for EU accounts
uv run python -m scripts.jev_check
```

Expected: one line per situation with the scores, a total, and an experiment name. In LangSmith the dataset
`spotted-jev-checks` has one example per situation and the experiment has one run per situation with the
`winner_on_top` feedback. Count the traces: N situations, N traces, no `evaluators` project, no new traces
in `spotted-jev`.

## 5. Two runs side by side (US1/AC4)

Run step 4 again and open the dataset's experiments tab: two experiments, comparable; the dataset still
has one example per situation (no duplicates).

## 6. LangSmith unreachable (FR-014)

```bash
LANGSMITH_ENDPOINT=http://127.0.0.1:9 uv run python -m scripts.jev_check
```

Expected: the full report is printed, the last line says the upload failed, and Jev was called once per
situation.

## 7. Results (filled in after the live run)

Done on 2026-10-04, offline (no keys):

- Step 1: 26 tests in `tests/test_jev_check.py`, whole suite 144 passed, also with dummy keys exported and
  `LANGSMITH_ENDPOINT=http://127.0.0.1:9` (no check run, no upload). Mutation checks: a fallback that reruns
  every situation, evaluator tracing left on, the traced client, no key check and "a tie passes" each make
  at least one test fail.
- Step 2: `--dry-run` lists the 8 situations and ends with `dry run, nothing sent`, exit 0.
- Step 3: each missing key gives `missing <NAME>` and exit 2.

Not run yet (needs the real keys, task T030): steps 4 to 6 against the real Jev and LangSmith.
