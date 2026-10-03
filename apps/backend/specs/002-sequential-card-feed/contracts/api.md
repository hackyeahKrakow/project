# API Contract: Sequential Card Feed

Real contract is generated at `/docs` (OpenAPI). All ids are UUID7.

## GET /card/new/{user_id}  (`card_new`)

- **Summary**: Get the next card in the fixed sequence.
- **Description**: Returns the next of six predefined cards (numbered 1 to 6) for this user. The
  first request returns card 1, then 2, and so on. The service remembers each user's position, so
  a card is never returned twice to the same user. After card 6 it returns 404.
- **Path**: `user_id` (UUID7), e.g. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Responses**:
  - `200` `CardFetchResponse`
  - `404` `ErrorResponse`: no more cards for this user
  - `422` `ErrorResponse`: invalid `user_id`
- **Example request**: `GET /card/new/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Example response (200)**:

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

- **Example response (404)**: `{ "detail": "No more cards" }`

The earlier `GET /card/{user_id}` and `POST /card/{user_id}` are unchanged.
