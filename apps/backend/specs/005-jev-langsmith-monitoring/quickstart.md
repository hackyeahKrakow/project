# Quickstart: validating Jev monitoring

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md) | **Contract**: [contracts/jev-trace.md](contracts/jev-trace.md)

Run from `apps/backend`. The LangSmith key is read from `LANGSMITH_API_KEY` and is never written to a
file that is committed.

## 1. Automated checks (no network, no key)

```bash
uv run pytest tests/test_monitoring_traces.py tests/test_monitoring_safety.py tests/test_monitoring_labels.py
uv run pytest            # the whole suite still passes on the plain Jev client
```

Expected: one trace per call with the right metadata; no key, user id or choices content in it; same
result and same exception as without monitoring; no failure when LangSmith cannot be reached.

## 2. A real trace (spec scenario 1.1, SC-001)

```bash
export LANGSMITH_API_KEY=...          # your key; add LANGSMITH_ENDPOINT if the account is in the EU
export OPENCODE_API_KEY=...           # a Jev key, so the call really happens
uv run fastapi dev app/main.py
```

Create a user, save some choices and answer a few cards, then ask for recommendations:

```bash
curl -X POST localhost:8000/info/<user-uuid7> -H 'content-type: application/json' -d '{"interests":["metal"]}'
curl localhost:8000/card/recommendations/<user-uuid7>
```

Expected: within a minute the project `spotted-jev` shows one run `jev.score_interest` with the model,
the card counts, `outcome=success`, the scores, and `choices_included=true` but not the text
`metal`. If nothing appears, check the region (`LANGSMITH_ENDPOINT`) and the service logs.

## 3. A failed Jev call (scenario 1.2, SC-004)

Start with a wrong `OPENCODE_API_KEY` and repeat the recommendations request.

Expected: the response is still 10 random cards; a run with `outcome=failed` and `reason=http_401`;
filtering the project by that outcome lists it.

## 4. LangSmith unreachable (scenario 2.2, SC-003)

```bash
LANGSMITH_ENDPOINT=http://127.0.0.1:9 uv run fastapi dev app/main.py
```

Expected: recommendations respond as usual and no slower than with monitoring off (at most 0.1 s more);
the logs show warnings from `langsmith.client` with the key masked.

## 5. Monitoring off (scenario 2.3)

Start without `LANGSMITH_API_KEY`.

Expected: no traces, no warnings, identical responses.

## 6. Vercel preview (research R7)

Set `LANGSMITH_API_KEY` (Sensitive), `LANGSMITH_PROJECT` and `ENVIRONMENT=production` in the Vercel
project, deploy a preview, and repeat scenario 2 against it.

Expected: the trace appears with the tag `production`. If traces are missing there, apply the bounded
flush from research R7 and test again.

## Results of the first run (2026-10-04)

Done against the real LangSmith and Jev with the keys passed only as environment variables.

- **Region**: the supplied key belongs to the EU region. On the default US endpoint every request was
  rejected with 403; with `LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com` it works. That
  variable must also be set in `.env` and in Vercel.
- **Scenario 2 (real trace)**: one trace `jev.score_interest`, status success, tag `dev`, metadata
  (4 candidates, 1 liked, 1 disliked, `has_choices`), scores as outputs. A made-up private marker put
  into the saved choices, the Jev key and the LangSmith key were all absent from the stored trace.
- **Scenario 3 (failed Jev call)**: with a wrong Jev key the caller got `JevError: http_401`, and the
  trace had status error, `outcome=failed`, `reason=http_401`. Filtering by the metadata key
  `outcome` found both traces.
- **Scenario 4 (LangSmith rejecting or unreachable)**: while the key was still on the wrong region
  every upload failed with 403, and the Jev call still answered normally (922 ms), with only warning
  lines in the log.
- **Scenario 5 (off)** is covered by `test_off_without_a_key`.
- **Scenario 6 (Vercel preview)** is not done yet (task T028).
