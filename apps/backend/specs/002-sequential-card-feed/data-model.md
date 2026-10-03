# Data Model: Sequential Card Feed

Code locations: `app/models.py` (tables), `app/seed.py` (sample cards).

## Existing: Card (table `cards`)

Unchanged. Six rows are seeded at startup, in this order (card number = position in the list):

| No. | Id | Content |
|-----|----|---------|
| 1-6 | Fixed UUID7, generated once and hardcoded in `app/seed.py` | Placeholder student events with every required field (`event_name`, `color_code` as `#RRGGBB`, `description`, `image_url` or null, `starts_at`, optional `ends_at`, `address`, `lat`, `lng`, `price` >= 0) |

Rules: seeding inserts only missing ids, so it is safe to run on every startup and never
overwrites edited rows.

## New: UserCardProgress (table `user_card_progress`)

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | UUID7 | Primary key; no foreign key (no users table) |
| `cards_served` | integer | Required, default 0, between 0 and 6 inclusive |

Created the first time a user asks for a card (starts at 0, becomes 1 on that same request).

## State transitions

`cards_served`: 0 -> 1 -> ... -> 6 (one step per successful request). At 6 the state is terminal:
further requests return "no more cards" and change nothing.

## Relationships

- `user_card_progress.user_id` and `card_responses.user_id` refer to the same anonymous user id but
  are independent tables.
- The card served for `cards_served = n` is the n-th seeded card.

## Schemas

No new schema. `CardFetchResponse` (200) and `ErrorResponse` (404, 422) from `app/schemas.py`.
