# Research: Basic Jev Checks in LangSmith

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

Findings come from the installed SDK (`langsmith` 0.14.4) and from feature 005. Items marked *verify* are
confirmed against the real services in the quickstart, not assumed.

## R1. How the run is recorded: the SDK's `evaluate`

- **Decision**: call `langsmith.evaluate(target, data=<examples>, evaluators=[winner_on_top],
  experiment_prefix="jev-check", client=<tracing client>, max_concurrency=0, num_repetitions=1,
  disable_evaluator_tracing=True, error_handling="log")`.
- **Rationale**: it is the SDK's intended way to make an experiment: it creates one experiment project per
  call, runs the target once per example, links each run to its example and stores each evaluator result as
  feedback. `num_repetitions=1` and `max_concurrency=0` (sequential) satisfy FR-006 and stay inside the free
  model's rate limit. `disable_evaluator_tracing=True` matters for the limits: by default the SDK also
  traces every evaluator call into a separate `evaluators` project, which would double the traces.
- **Alternatives**: tracing the situations with `@traceable` into a project of our own, with no dataset
  (loses the side-by-side comparison, FR-005); `aevaluate` (needs an async target for no gain, the target
  is one call); a pytest test with a LangSmith plugin (would run with the normal tests, against FR-007).

## R2. The target calls the plain `JevClient`, not the traced one

- **Decision**: build `JevClient` directly from the settings (`opencode_api_key`, `jev_model`, `jev_url`,
  `jev_timeout_seconds`) and call `score_interest` from the target with `asyncio.run`.
- **Rationale**: `get_jev_client()` would return `TracedJevClient` when `LANGSMITH_API_KEY` is set, which
  would send a second trace per call into the production project `spotted-jev` (double the usage, and the
  mixing FR-009 forbids). The plain client has no tracing, so the only trace is the experiment run.
- **Alternatives**: an extra `Settings` switch to turn the traced client off (a change in `app/` for no
  gain); building a traced client with another project name (two traces per call).

## R3. Separation from production traces (FR-009)

- **Decision**: the experiment project is created by `evaluate` under its own name (`jev-check-<suffix>`),
  inside the same LangSmith account; the script never reads `LANGSMITH_PROJECT`.
- **Rationale**: the separation is structural, not a setting a developer can forget. The dataset is named
  `spotted-jev-checks`, also distinct from `spotted-jev`.
- **Alternatives**: a second LangSmith workspace (more setup than the request asks for).

## R4. Dataset sync: upsert by stable ids, run exactly the file's cases

- **Decision**: each situation gets a stable id (`uuid5` of its name). At the start the script reads the
  dataset's examples, creates the dataset if it is missing, creates or updates only examples whose inputs or
  expected outputs differ, deletes examples whose id is not in the file, and passes the resulting example
  objects (not the dataset name) to `evaluate`.
- **Rationale**: no duplicates on repeated runs; editing the file is the only maintenance (SC-006); passing
  the list guarantees one request per situation in the file even if someone adds an example in the
  LangSmith UI (FR-006). Examples are stored data, not traces, so syncing costs no trace limit.
- **Alternatives**: recreating the dataset each run (new dataset versions every time, clutter); passing the
  dataset name (would also run examples that are not in the file).

## R5. Pass rule and the three results

- **Decision**: a pure function `top_candidate_wins(scores, expected_id)`: passes only if the expected
  candidate has a score and it is strictly greater than the score of every other candidate that has one;
  a tie or a missing expected score is a failure with a comment. A `JevError` is not caught by the target:
  the run is recorded as errored by LangSmith and shown locally as `error` with its reason code.
- **Rationale**: matches FR-003 and FR-004 and the edge cases (tie fails, no minimum gap). Errors stay out
  of the pass rate because an errored run has no evaluator result. The reason codes are the safe ones that
  `JevClient` already produces.
- **Alternatives**: a minimum score gap (spec says none in v1); catching the error and returning a score of
  zero (would turn an outage into a "failed recommendation").

## R6. Local results come first and do not depend on LangSmith (FR-014)

- **Decision**: the target also stores each situation's outcome (scores, error code, duration) in a local
  dict as it runs, and the report is built from that dict, not from the experiment results. If preparing
  LangSmith raises before any call (dataset sync, client creation), the script prints "upload failed",
  runs the same situations once through a plain loop with no tracing, and prints the same report. After
  the run it calls `client.flush()` inside `try/except` and says so if that fails.
- **Rationale**: the verdict is never lost because of LangSmith; Jev is still called once per situation in
  both paths. A flush can wait up to about 10 s on an unreachable endpoint (learned in 005), which is
  acceptable for a manual command.
- **Alternatives**: building the report from `ExperimentResults` (breaks when upload is off); running Jev
  first and replaying the results into LangSmith (the trace durations would be fake).

## R7. Checks before anything is sent (FR-008, FR-010)

- **Decision**: validate in this order and stop with exit code 2 on the first problem: the file loads and
  has 5 to 10 situations; each situation has the documented fields only (no extra keys), unique name,
  at least 2 candidates with unique names, and its expected winner among them; then the Jev key; then the
  LangSmith key. Messages name the situation or the missing variable, never a value. `--dry-run` runs only
  the file checks and prints the situations, so a case can be written without any key.
- **Rationale**: the unknown-keys rule is what keeps the "invented data only" promise (FR-013) from
  eroding when someone pastes in a real card or a saved choice.

## R8. Cost of a run against the free allowances

- **Decision**: one run is N traces for N situations (target of 8): 1 run per trace. Evaluator tracing is
  off, the dataset sync stores no traces, and feedback is not a trace.
- **Rationale and caveat**: 8 situations, 10 runs in one day, are 80 traces, 2,400 a month if done every
  day, which is under half of the 5,000 traces a month that the free LangSmith plan allowed when this was
  written (*verify in the account's usage page*). SC-002 holds, but the realistic use (a few runs a week)
  is far lower. The same allowance serves feature 005's production traces, so the check stays at 8
  situations, not 10, in the first version. Jev's free model has its own limit, so the script never loops
  or retries.

## R9. What stays untouched

- **Decision**: no edit under `app/`, `pyproject.toml`, `.env.example`, the frontend or CI. The script reads
  the existing settings and the tracing client factory from `app/monitoring.py` (`build_tracing_client`), so
  the EU endpoint and the short timeouts from 005 apply.
- **Rationale**: FR-011 and the "changes only in `apps/backend`" rule. The anonymizer of 005 also applies
  to the experiment runs, which is harmless because the situations hold no secrets.
