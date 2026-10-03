# Research: Card Swipes Table

## 1. Table shape and key

- **Decision**: Table `card_swipes` with columns `user_id` (UUID), `card_id` (UUID, foreign key to
  `cards.id`), `swipe` (Boolean, not null), `created_at` (UTC datetime, not null). Primary key is the
  pair (`user_id`, `card_id`).
- **Rationale**: The request lists exactly these four fields, no separate id. The composite key
  enforces "one answer per user per card" in the database, which also makes concurrent duplicates
  safe (see 3).
- **Alternatives**: A surrogate UUID7 id plus a unique constraint (rejected: an extra column nobody
  asked for); a log allowing repeated answers (rejected: spec assumes one answer, duplicates are 409).

## 2. Timestamp

- **Decision**: Reuse the `UTCDateTime` column type from `app/models.py` (stores UTC, returns
  timezone-aware values). `created_at` gets a Python-side default `datetime.now(timezone.utc)` at
  insert time; the request schema has no such field, and extra fields in the body are ignored.
- **Rationale**: The same type already fixes the SQLite timezone problem for card times. A
  server-side default means the client cannot choose the value (FR-003).
- **Alternatives**: SQL `server_default=func.now()` (rejected: returns naive local-style values in
  SQLite and bypasses our UTC type); rejecting extra body fields with `extra="forbid"` (rejected: would
  break clients that send harmless extras).

## 3. One answer per user and card, race-free

- **Decision**: Insert the row and catch `IntegrityError` on the primary key: roll back and raise
  `AlreadyAnsweredError` (HTTP 409). Check the card exists first (`session.get(Card, id)`) and raise
  `CardNotFoundError` (HTTP 404) so nothing is inserted for an unknown card.
- **Rationale**: The database decides the winner when two identical requests arrive together, so
  exactly one row is saved and the other gets 409 (spec edge case). A foreign key alone would give a
  confusing integrity error for unknown cards, so the explicit check gives a clear 404. SQLite
  enforces foreign keys only when enabled, so the explicit check is required anyway.
- **Alternatives**: Check-then-insert without catching the error (rejected: race condition);
  `INSERT ... ON CONFLICT DO NOTHING` and inspect rowcount (viable; rejected for less readable code).

## 4. Mapping the swipe value

- **Decision**: The request and response keep the words `right` / `left` (`Decision` enum) as in the
  published contract; the service maps `RIGHT` to `True` and `LEFT` to `False` when saving and back
  when responding. The response gains `created_at`.
- **Rationale**: Spec assumption; avoids a breaking change for the frontend. Adding a field to the
  response is backward compatible.
- **Alternatives**: Boolean in the request body (rejected for now: changes the contract; easy to
  add later).

## 5. Replacing `card_responses`

- **Decision**: Remove the `CardResponse` model and the `Card.responses` relationship; keep the
  `Decision` enum for the API. Switch `app/recommender.py` (history: `swipe` true = liked, false =
  disliked; exclusion: card ids in `card_swipes` for the user) and the tests to `CardSwipe`.
- **Rationale**: One source of truth for answer history (spec FR-009). The old table never received
  data because POST was a skeleton, so there is nothing to migrate.
- **Existing databases**: `create_all` adds the new table to an existing `app.db`; the unused old
  `card_responses` table stays as harmless leftovers. Deleting the local `app.db` also cleans it.

## 6. Testing

- **Decision**: New `tests/test_card_swipes.py` with the file-based database fixtures: right and left
  saved with correct bool and timestamp window; unknown card 404; bad decision / ids 422; duplicate
  409 keeping the first row; concurrent duplicates via `asyncio.gather` leaving one row; client-supplied
  `created_at` ignored; restart persistence; recommendations exclude swiped cards and pass the right
  history. Update the old 501 tests.
- **Rationale**: Covers every acceptance scenario and edge case in the spec.

## Open questions (non-blocking, defaults chosen)

1. `docs/API.md` still describes the old POST response; add `created_at` when the team agrees
   (outside `apps/backend`, so not changed here).
2. Whether the request should send a boolean instead of `right`/`left` is left for a later change.
3. This branch is stacked on the unmerged `feature/rec_algorithm`; merge that PR first.
