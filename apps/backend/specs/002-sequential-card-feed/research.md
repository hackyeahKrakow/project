# Research: Sequential Card Feed

## 1. Where the six cards live

- **Decision**: Hardcode the six cards as an ordered list in `app/seed.py` (fixed UUID7 ids,
  generated once and pasted in) and insert any missing ones into the `cards` table at startup
  (`init_db` after `create_all`). The list order is the card number (1 to 6).
- **Rationale**: Uses the existing `Card` model and table (as requested) without changing it; no
  new column is needed because the order is defined by the list. Startup seeding is idempotent, so
  restarts do not duplicate rows.
- **Alternatives**: A `position` column on `Card` (rejected: changes the existing model for six
  sample rows); returning the cards straight from code without the DB (rejected: bypasses the DB
  the team asked to reuse).

## 2. Remembering progress

- **Decision**: New table `user_card_progress` (`user_id` primary key, `cards_served` integer,
  default 0). The next card for a user is `SEED_CARDS[cards_served]`.
- **Rationale**: One row and one integer per user is the simplest durable memory (survives restart
  because it is in SQLite). The existing `card_responses` table cannot be reused: it records swipe
  decisions, while fetching advances progress even without a response (spec assumption).
- **Alternatives**: Store the last served card id (rejected: needs a lookup to find the next);
  in-memory dict (rejected: lost on restart, FR-007).

## 3. Race-free advance

- **Decision**: In one transaction: `INSERT ... ON CONFLICT DO NOTHING` the user row (SQLAlchemy
  SQLite dialect `insert().on_conflict_do_nothing()`), then
  `UPDATE user_card_progress SET cards_served = cards_served + 1 WHERE user_id = :id AND
  cards_served < 6 RETURNING cards_served`. No row returned means all cards were served (404).
  The served card is `SEED_CARDS[returned - 1]`.
- **Rationale**: SQLite serializes writers, and one atomic UPDATE guarantees two concurrent
  requests get different cards with no skips or repeats (edge case in the spec). `RETURNING` is
  supported by SQLite 3.35+ and SQLAlchemy 2.
- **Alternatives**: Read-then-write (rejected: race condition); a lock in Python (rejected: does
  not work across multiple workers).

## 4. Endpoint design

- **Decision**: `GET /card/new/{user_id}`, `operation_id="card_new"`, returns `CardFetchResponse`,
  `404` with `ErrorResponse` after the sixth card, `422` for an invalid UUID7 (existing handler).
  Registered in `app/routes.py`. The path has two segments after `/card`, so it does not clash with
  `GET /card/{user_id}`.
- **Rationale**: Matches the requested path; reuses the schema and error shape.

## 5. Testing

- **Decision**: `tests/conftest.py` creates an in-memory SQLite engine with `StaticPool`, creates
  tables, seeds cards, and overrides the `get_session` dependency. Tests call the endpoint through
  `httpx.ASGITransport` (the app lifespan is not needed). Include a concurrency test using
  `asyncio.gather` for one user.
- **Rationale**: Isolated, fast, and no file database to clean up.

## Open questions (non-blocking, defaults chosen)

1. After card 6 the endpoint returns 404 (no cycling), as assumed in the spec.
2. The new endpoint is not yet in `docs/API.md`. Constitution limits changes to `apps/backend`, so
   it is left for the team to add (or ask for it) when merging.
3. The six sample cards' contents (Kraków student events) are placeholders written by us.
