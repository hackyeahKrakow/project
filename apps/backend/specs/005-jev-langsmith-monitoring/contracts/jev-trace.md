# Contract: Jev call trace and monitoring settings

**Date**: 2026-10-04 | **Spec**: [../spec.md](../spec.md) | **Model**: [../data-model.md](../data-model.md)

This feature adds no endpoint and changes no API response. Its only interfaces are the trace sent to
LangSmith and the settings that turn it on.

## Trace sent to LangSmith (one per Jev call)

| Part | Value |
|------|-------|
| Run name | `jev.score_interest` |
| Run type | `chain` |
| Project | `langsmith_project` (default `spotted-jev`) |
| Tags | `[<environment>]`, for example `dev` or `production` |

### Inputs

```json
{
  "model": "jev-1.13-free",
  "questions": 10,
  "candidates": [
    {"id": "01a103a0-2efc-750f-ad11-896f7fa55c5d", "event_name": "Korn", "description": "...", "price": null, "address": "..."}
  ],
  "liked": [{"id": "01a103a0-2eff-7af1-b24f-0f7fc0514754", "event_name": "Polska Noc Kabaretowa 2026"}],
  "disliked": [],
  "choices_included": true
}
```

The content of the user's saved choices never appears; only `choices_included`.

### Outputs

- Success: `{"scores": {"<card id>": 0.87, ...}}`.
- Failure: no outputs; the run carries the error `JevError('<reason>')`.

### Metadata

| Key | Values |
|-----|--------|
| `outcome` | `success` or `failed` |
| `reason` | only on failure: `timeout`, `http_<status>`, `network_error`, `invalid_response`, `missing_api_key` or `unexpected_error` (any error that is not a `JevError`; the run's own error field still shows it as the SDK records it) |
| `model` | the Jev model name |
| `candidates`, `liked`, `disliked` | integers |
| `has_choices` | boolean |

### Guarantees (tested)

1. Exactly one trace per call to Jev; none when Jev is not called.
2. The caller receives the same result, or the same exception, as without monitoring.
3. No user identifier, location, saved-choices content, Jev key or LangSmith key in the body.
4. A failure of monitoring never raises into the request.

## Settings

| Setting (environment variable) | Required | Notes |
|--------------------------------|----------|-------|
| `LANGSMITH_API_KEY` | No | Monitoring is on only when set. Never committed; `.env.example` holds an empty placeholder. |
| `LANGSMITH_PROJECT` | No | Default `spotted-jev`. |
| `LANGSMITH_ENDPOINT` | No | Default empty (SDK default, US). EU accounts set their regional URL. |
| `ENVIRONMENT` | No | Existing setting; becomes the trace tag (`dev` by default, `production` on Vercel). |

On Vercel the same variables are set in the project's environment variables (mark the key Sensitive).
