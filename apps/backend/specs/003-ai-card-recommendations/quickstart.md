# Quickstart: AI Card Recommendations

Run all commands from `apps/backend`. Setup as in `specs/001-card-swipe-api/quickstart.md`.

## Prerequisites

- An OpenCode API key from the OpenCode Console (https://opencode.ai). Put it in your local
  `.env` only: `OPENCODE_API_KEY=...`. Never commit it. Without a key the endpoint still works
  using the random fallback.
- Optional: `JEV_MODEL=jev-1.13` for the paid model (default is `jev-1.13-free`).

## Run

```bash
uv run fastapi dev app/main.py
```

## Validate

Use more than 50 cards in the database for steps 1 to 4 (add them with a small script or by
inserting rows; the six seeded cards cover the small-data cases).

1. **Ten of fifty**: with 60 unanswered cards, `GET /card/recommendations/<user>` returns exactly 10
   distinct cards (SC-001).
2. **Uses history**: answer right on several cards of one kind and left on others via
   `POST /card/<user>`, then request again; the list should favour the liked kind (check the
   `jev_scored` log line). With a real key this proves Jev is reached.
3. **Never answered cards**: none of the returned cards were answered by that user (SC-003).
4. **Small data**: with only the six seeded cards you get all 6; with all answered you get `[]`;
   no errors (SC-002).
5. **AI down**: unset `OPENCODE_API_KEY` or set a wrong one; the endpoint still returns up to 10
   random cards and logs `jev_failed` (SC-004).
6. **Validation**: `GET /card/recommendations/not-a-uuid` returns `422` and Jev is not called.
7. **No secrets**: `git grep -i opencode_api_key` shows only the setting name and the empty
   placeholder; logs never show the key (SC-006).
8. **Request size**: confirm with a real key that 50 questions in one request are accepted; if not,
   see research.md section 2.

## Tests

```bash
uv run pytest
```
