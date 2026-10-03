# API Contract: Card Swipe API

All ids are UUID7 strings. JSON bodies. Real contract is generated at `/docs` (OpenAPI) by FastAPI.

## GET /health  (`health`)

- **Summary**: Health check.
- **Description**: Returns `ok` when the service is running. Used by operators and monitors.
- **Responses**: `200` `HealthResponse`.
- **Example response**:

```json
{ "status": "ok" }
```

## GET /card/{user_id}  (`card_fetch`)

- **Summary**: Get the next card for a user.
- **Description**: Returns exactly one event card the user has not responded to yet.
- **Path**: `user_id` (UUID7).
- **Responses**:
  - `200` `CardFetchResponse`
  - `404` `ErrorResponse` no more cards available for this user
  - `422` invalid `user_id`
  - `501` not implemented yet (skeleton)
- **Example request**: `GET /card/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Example response**:

```json
{
  "id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "event_name": "Krakow Night Market",
  "color_code": "#FF8800",
  "description": "Street food and live music.",
  "image_url": "/images/night-market.png",
  "starts_at": "2026-11-15T18:00:00+01:00",
  "ends_at": null,
  "address": "Rynek Glowny 1, Krakow",
  "lat": 50.0617,
  "lng": 19.9373,
  "price": 0
}
```

## POST /card/{user_id}  (`card_response`)

- **Summary**: Respond to a card.
- **Description**: Records the user's swipe decision (`right` = interested, `left` = not interested)
  for a card.
- **Path**: `user_id` (UUID7).
- **Body**: `CardResponseRequest`.
- **Responses**:
  - `201` `CardResponseOut`
  - `404` `ErrorResponse` card not found
  - `409` `ErrorResponse` user already responded to this card
  - `422` invalid ids or decision
  - `501` not implemented yet (skeleton)
- **Example request**: `POST /card/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "decision": "right"
}
```

- **Example response**:

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
  "decision": "right"
}
```
