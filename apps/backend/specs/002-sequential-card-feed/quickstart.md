# Quickstart: Sequential Card Feed

Run all commands from `apps/backend`. Setup is the same as in
`specs/001-card-swipe-api/quickstart.md` (`uv sync`, `cp .env.example .env`).

## Run

```bash
uv run fastapi dev app/main.py
```

## Validate

Use two user ids, A = `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90` and
B = `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e91`.

1. **Order**: call `GET /card/new/<A>` six times; the cards come back in order 1 to 6, each once
   (spec SC-001).
2. **Exhaustion**: a seventh call returns `404` and keeps returning `404` (FR-008).
3. **Per user**: call `GET /card/new/<B>`; it returns card 1 even though A is finished (FR-006).
4. **Persistence**: stop and restart the server; `GET /card/new/<B>` returns card 2 (FR-007).
5. **Validation**: `GET /card/new/not-a-uuid` returns `422` and changes nothing (FR-010).
6. **Old endpoints**: `GET /card/<A>` still returns `501` (FR-011).
7. **Docs**: `/docs` shows `card_new` with summary, description and example (see
   [contracts/api.md](contracts/api.md)).

To start over, stop the server and delete the local `app.db` file (git-ignored).

## Tests

```bash
uv run pytest
```
