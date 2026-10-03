# Quickstart: Card Swipe API

Validation guide for this feature. Run all commands from `apps/backend`.

## Prerequisites

- Python 3.11+ and [uv](https://docs.astral.sh/uv/)
- `cp .env.example .env` (placeholders only; never commit `.env`)

## Setup

```bash
uv sync
```

## Run

```bash
uv run fastapi dev app/main.py
```

## Validate

1. **Health**: `curl http://127.0.0.1:8000/health` returns `{"status":"ok"}` (spec User Story 1).
2. **Docs**: open `http://127.0.0.1:8000/docs`; each endpoint shows a summary, description, typed
   schemas and an example (SC-002). Compare with [contracts/api.md](contracts/api.md).
3. **Skeletons**: `GET /card/<uuid7>` and `POST /card/<uuid7>` return `501` until implemented.
4. **Validation**: `GET /card/not-a-uuid` returns `422`; a decision other than `right`/`left`
   returns `422` (SC-004).
5. **Database**: after startup, the SQLite file defined by `DATABASE_URL` contains tables `cards`
   and `card_responses` (see [data-model.md](data-model.md)).
6. **Logs**: startup and each request print structured log lines; no secret values appear.

## Tests

```bash
uv run pytest
```
