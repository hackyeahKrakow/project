# Quickstart: Card Swipes Table

Run all commands from `apps/backend`. Setup as in `specs/001-card-swipe-api/quickstart.md`. If you
have an old local `app.db`, delete it first (git-ignored) so you start clean.

## Run

```bash
uv run fastapi dev app/main.py
```

## Validate

Use a card id from `GET /card/new/<user>` (it returns real seeded cards) and two user ids A and B.

1. **Save right**: `POST /card/<A>` with `{"card_id": "<card>", "decision": "right"}` returns `201`
   with `created_at` (SC-001).
2. **Stored values**: `sqlite3 app.db "select * from card_swipes"` shows `swipe = 1` for right, `0`
   for left, and a UTC `created_at` close to now (SC-003, FR-003).
3. **Left**: answer a second card with `left` and check `swipe = 0`.
4. **Repeat**: send the same answer again: `409`, and the stored row is unchanged (SC-002).
5. **Unknown card**: a random UUID7 as `card_id` returns `404`; no new row.
6. **Invalid**: `decision: "up"` or `not-a-uuid` returns `422`; no new row.
7. **Client time ignored**: add `"created_at": "2000-01-01T00:00:00Z"` to the body; the stored time is
   still "now".
8. **Persistence**: restart the server; the rows are still there (SC-004).
9. **Users**: answer the same card as user B: `201`, a separate row.
10. **Recommendations**: `GET /card/recommendations/<A>` does not return the cards A answered
    (SC-006); with an OpenCode key the log line `jev_scored` shows `liked` and `disliked` counts that
    match A's answers.

## Tests

```bash
uv run pytest
```
