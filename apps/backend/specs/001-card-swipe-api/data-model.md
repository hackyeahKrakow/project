# Data Model: Card Swipe API

Code locations: SQLAlchemy models in `app/models.py`, Pydantic schemas in `app/schemas.py`.

## Entity: Card (table `cards`)

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID7 | Primary key, generated with `uuid7()` |
| `event_name` | string (max 200) | Required, not empty |
| `color_code` | string (7) | Required, format `#RRGGBB` |
| `description` | text | Required |
| `ad_image_url` | string (max 2048) | Required, http(s) URL of the advertisement graphic |
| `event_date` | date | Required |
| `location_street` | string (max 200) | Required (street / place) |

## Entity: CardResponse (table `card_responses`)

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | UUID7 | Part of the primary key |
| `card_id` | UUID7 | Part of the primary key; foreign key to `cards.id` |
| `decision` | enum `Decision` | `right` or `left`, stored as a string |

A composite primary key (`user_id`, `card_id`) enforces "at most one response per user per card"
(spec edge case). A duplicate must map to HTTP 409.

## Relationships

- `Card` 1 — N `CardResponse` (via `card_id`).
- There is no `users` table in this feature; `user_id` is a plain UUID7 (spec assumption).

## State transitions

None. A response is created once and never changed.

## Pydantic schemas

| Schema | Used by | Fields |
|--------|---------|--------|
| `HealthResponse` | `GET /health` | `status` |
| `CardFetchResponse` | `card_fetch` output | `id`, `event_name`, `color_code`, `description`, `ad_image_url`, `event_date`, `location_street` |
| `CardResponseRequest` | `card_response` body | `card_id` (UUID7), `decision` (`right`/`left`) |
| `CardResponseOut` | `card_response` output | `card_id`, `user_id`, `decision` |
| `ErrorResponse` | error responses | `detail` |

Path parameter `user_id` is validated as UUID7 by FastAPI.
