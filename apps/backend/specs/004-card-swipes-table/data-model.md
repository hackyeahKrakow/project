# Data Model: Card Swipes Table

Code location: `app/models.py` (table), `app/schemas.py` (API shapes).

## New: CardSwipe (table `card_swipes`)

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | UUID7 | Part of the primary key; no foreign key (there is no users table) |
| `card_id` | UUID7 | Part of the primary key; foreign key to `cards.id`; the card must exist |
| `swipe` | boolean | Required; `true` = swipe right (interested), `false` = swipe left (not interested) |
| `created_at` | datetime (timezone-aware, stored as UTC) | Required; set by the service at creation; never taken from the client; never changed |

Rules:
- At most one row per (`user_id`, `card_id`): the primary key. A repeat is rejected with 409.
- Rows are created once and never updated or deleted by the API.

## Removed: CardResponse (table `card_responses`)

Replaced by `card_swipes` (no data to migrate). The `Decision` enum (`right` / `left`) stays as the
API vocabulary only.

## Mapping

| API `decision` | Stored `swipe` |
|----------------|----------------|
| `right` | `true` |
| `left` | `false` |

## Relationships

- `card_swipes.card_id` many-to-one `cards.id`.
- `card_swipes.user_id` refers to the anonymous user id used everywhere else (no table).

## State transitions

None. A swipe is created once.

## Schemas

| Schema | Used by | Fields |
|--------|---------|--------|
| `CardResponseRequest` | POST body | `card_id` (UUID7), `decision` (`right` / `left`); no timestamp field, extra fields ignored |
| `CardResponseOut` | POST 201 | `card_id`, `user_id`, `decision`, `created_at` (new) |
| `ErrorResponse` | 404, 409, 422 | `detail` |
