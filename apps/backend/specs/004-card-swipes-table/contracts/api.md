# API Contract: Card Swipes Table

Real contract is generated at `/docs` (OpenAPI). All ids are UUID7.

## POST /card/{user_id}  (`card_response`)

- **Summary**: Respond to a card.
- **Description**: Saves the user's swipe for a card (`right` = interested, stored as `true`;
  `left` = not interested, stored as `false`) together with the time of saving. A user can answer a
  card only once.
- **Path**: `user_id` (UUID7), e.g. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Body**: `CardResponseRequest`
- **Responses**:
  - `201` `CardResponseOut`
  - `404` `ErrorResponse`: card not found, nothing saved
  - `409` `ErrorResponse`: user already answered this card, existing record unchanged
  - `422` `ErrorResponse`: invalid ids or `decision` other than `right`/`left`, nothing saved
- **Example request**: `POST /card/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "decision": "right"
}
```

- **Example response (201)**:

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
  "decision": "right",
  "created_at": "2026-10-03T15:42:10.123456Z"
}
```

- **Example response (409)**: `{ "detail": "Card already answered" }`
- **Example response (404)**: `{ "detail": "Card not found" }`

`created_at` is set by the service; a `created_at` sent in the body is ignored.

## Changed behaviour elsewhere

- `GET /card/recommendations/{user_id}` reads the user's right/left history and the list of answered
  cards from the saved swipes (same response format as before).
- All other endpoints are unchanged.
