# Contract: the Jev check command

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

This is a developer interface, not an API endpoint. Run from `apps/backend`.

## Command

```bash
uv run python scripts/jev_check.py            # run all situations against the real Jev
uv run python scripts/jev_check.py --dry-run  # validate the file and list the situations, send nothing
```

## Environment (read through the existing settings, from `.env` or the shell)

| Variable | Needed for | If missing |
|----------|------------|------------|
| `OPENCODE_API_KEY` | the Jev calls | exit 2, "missing OPENCODE_API_KEY", nothing sent |
| `LANGSMITH_API_KEY` | the experiment | exit 2, "missing LANGSMITH_API_KEY", nothing sent |
| `LANGSMITH_ENDPOINT` | EU accounts | the SDK default (US) is used |
| `JEV_MODEL`, `JEV_URL`, `JEV_TIMEOUT_SECONDS` | the Jev calls | the service's defaults |

`--dry-run` needs neither key. Values of keys are never printed.

## Output (stdout)

One line per situation, then a summary, then where to look:

```text
 PASS  metal fan picks the concert        Korn 0.91  Spacer 0.08
 FAIL  student picks the free event       top was Gala (tie 0.50)
 ERROR walk lover and the gallery         http_429
passed 1 of 2 (1 error)
LangSmith experiment: jev-check-3f9a1c2e (dataset spotted-jev-checks)
```

If the upload fails the same lines appear and the last line says `LangSmith upload failed: <error type>`.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | every situation passed |
| 1 | at least one situation failed or errored |
| 2 | could not start: malformed file, a key is missing; nothing was sent |

## Situations file: `scripts/jev_check_cases.json`

```json
[
  {
    "name": "metal fan picks the concert",
    "liked": [{"name": "Korn tribute", "description": "Metal concert in a club"}],
    "disliked": [{"name": "Morning walk", "description": "Quiet walk in the park"}],
    "candidates": [
      {"name": "Thrash night", "description": "Loud metal bands on stage"},
      {"name": "Book fair", "description": "Stalls with books and tea"}
    ],
    "expected": "Thrash night"
  }
]
```

Rules are in [data-model.md](../data-model.md): 5 to 10 situations, unique names, at least 2 candidates,
`expected` among the candidates, no keys other than the ones shown.

## Guarantees

- At most one Jev request and one LangSmith trace per situation; no retries, no repetition.
- Nothing is sent when validation or a key check fails.
- Nothing under `app/` changes behavior; the recommender, routes and monitoring are not touched.
- The normal `uv run pytest` neither runs this command nor needs its keys.
