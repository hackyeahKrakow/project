# Research: Jev Monitoring with LangSmith

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

No NEEDS CLARIFICATION is left in the spec (FR-004 was settled as option B). The questions below were
answered by reading the SDK source and by an experiment with `langsmith` 0.14.4 against a local
stand-in for the LangSmith API (dummy key, nothing sent to the internet). The experiment script lived
outside the repository.

## R1 - How to send traces

- **Decision**: the `langsmith` Python SDK: `traceable` around one function plus an explicit `Client`.
- **Rationale**: Jev is called with a plain HTTP request, so there is no LLM library that traces
  itself. The SDK already batches, retries and uploads in a background thread, which is exactly the
  "do not slow the request" behavior FR-006 needs, in a few lines.
- **Alternatives considered**:
  - Posting runs to the LangSmith REST API ourselves: more code, and batching, retries and
    timeouts would be rebuilt by hand.
  - LangChain callbacks or OpenTelemetry: the project uses neither, and both are far more machinery
    than "don't overcomplicate it" allows.
  - Setting `LANGSMITH_TRACING=true` and decorating `JevClient.score_interest` directly: edits the
    existing class, turns tracing on process-wide, and reads the key from the process environment
    instead of our settings.

## R2 - Where the code goes (no backend logic change)

- **Decision**: a new module `app/monitoring.py` with `TracedJevClient(JevClient)` that overrides only
  `score_interest`: it calls `super().score_interest(...)` inside a trace and returns the result or
  re-raises the exception untouched. The only edit to existing code is the factory
  `get_jev_client()`, which returns `TracedJevClient` when a LangSmith key is configured and the plain
  `JevClient` otherwise.
- **Rationale**: `JevClient`, `recommender.py` and the routes stay byte-for-byte as they are, so FR-005
  holds by construction. With no key the plain class is used and there is no tracing code on the path
  at all.
- **Alternatives considered**: decorating the method in place (touches existing logic); wrapping in
  `recommender.py` (touches the logic the request said not to touch).

## R3 - Turning it on, and a trap in the SDK

- **Decision**: three optional settings in `app/config.py`: `langsmith_api_key` (secret),
  `langsmith_project` (default `spotted-jev`) and `langsmith_endpoint` (default empty, meaning the
  SDK default). The environment label reuses the existing `environment` setting. The client is created
  once and passed explicitly; tracing is enabled explicitly with `tracing_context(enabled=True,
  client=...)`.
- **Rationale**: our settings read `.env`, but the SDK only reads the real process environment, so a
  key in `.env` would silently never reach it. Passing the client explicitly works the same locally
  and on Vercel.
- **Verified in the experiment**: without enabling tracing, `traceable` records nothing and
  `get_current_run_tree()` returns `None`, even when a client is passed. Any code that adds metadata
  to the run without checking for `None` would raise and change the app's behavior, so every use of
  the run object must be guarded. With tracing disabled the server received 0 runs and the call
  returned the same result.
- **Region**: a LangSmith key belongs to one region. The default endpoint is the US one; an EU account
  needs `langsmith_endpoint` set (per LangSmith's documentation, not checked here). Which region the
  supplied key belongs to is unknown until the first real trace (see quickstart, scenario 2).

## R4 - What a trace may contain (spec FR-003, FR-004, option B)

- **Decision**: redact inputs with the decorator's `process_inputs` hook. Kept: the model, the number
  of questions, the candidate cards exactly as sent to Jev (id, name, description, price, address),
  and the liked and disliked cards as id and name only (this also keeps big histories small). Dropped:
  the content of the user's saved choices, replaced by `choices_included: true/false`. The hook falls
  back to a minimal safe value if it ever fails and never to the raw inputs.
- **Verified**: the SDK removes `self` from the captured inputs (`_get_inputs` pops `self` and `cls`),
  so the Jev key stored on the client object is never captured. The state built by the recommender
  contains no user identifier. In the experiment the stand-in server received a trace whose body
  contained neither the key nor the text of the user's choices.
- **Alternatives considered**: a global `hide_inputs` on the client (hides everything, so the trace
  would not show which cards were scored); relying on callers to pass clean data (fragile).

## R5 - Outcome and reason

- **Decision**: add `outcome` (`success` or `failed`) and `reason` to the run's metadata from inside
  the traced function, then re-raise. `JevError` messages are already safe by design (`timeout`,
  `http_401`, `missing_api_key`, `invalid_response`). The run also ends with LangSmith's own error
  status.
- **Verified**: the exception reached the caller unchanged (`JevError timeout`), the trace carried
  `outcome=failed` and `reason=timeout`, and a successful call carried `outcome=success` and the
  scores as outputs. A user with no history and no choices never reaches Jev, so there is no trace
  (spec scenario 1.3).

## R6 - Monitoring must not break or slow a request

- **Verified**:
  - Overhead of a traced call with background upload: about 1 ms (10.2 ms plain against 11.2 to
    11.4 ms traced, with the Jev call stubbed at 10 ms).
  - Endpoint unreachable: the call returned in 12 ms with no exception; the SDK logs a warning from
    the `langsmith.client` logger per failed upload, with the key masked (`lsv2_******xx`).
  - Endpoint accepts but never answers: the call itself still returned in 13 ms.
  - `client.flush()` on an unreachable endpoint blocked for about 9 to 12 seconds (its retries), so it
    must never be called without a time limit.
- **Decision**: rely on the background upload, set short client timeouts (connect 2 s, read 5 s), and
  wrap our own metadata code in a guard so that nothing we add can raise.

## R7 - Vercel (serverless)

- **Question**: after the response is sent, does the process keep running long enough for the
  background upload? The Vercel Python reference documents no `wait_until` equivalent, so this cannot
  be settled from documentation.
- **Decision**: ship without a flush and verify on a preview deployment (quickstart, scenario 6). If
  traces go missing there, add a bounded flush after the call:
  `await asyncio.wait_for(asyncio.to_thread(client.flush), 0.1)`. In the experiment this returned
  after exactly 100 ms against a server that never answers, which keeps the 0.1 s bound of SC-003.
- **Rationale**: the simple version first, as requested; the fallback is known and measured.

## R8 - Dependency

- **Decision**: add `langsmith` (0.14.4 at the time of writing, Python 3.10 or newer) with
  `uv add langsmith`. It brings several transitive packages (among them `orjson`, `zstandard`,
  `websockets` and a second `httpx`-family package), all with wheels for Linux.
- **Rationale**: the footprint is acceptable for a serverless bundle; avoiding it would mean
  re-implementing R1.

## R9 - Testing without network

- **Decision**: `TracedJevClient` accepts an optional tracing client, so tests inject a `Client`
  built with a fake HTTP session (and batching off), capture what it would send, and assert on it:
  one trace per call, the metadata, no key, no user id, no choices content, same result and same
  exception as the plain client, and no failure when the session raises connection errors. The
  default settings have no key, so every existing test keeps running on the plain `JevClient`.
- **Open point**: the exact way to inject the fake session into `Client` (the constructor has
  `session` and `auto_batch_tracing` parameters) is confirmed while writing the tests.
