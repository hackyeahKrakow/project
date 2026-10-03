# API Contract: AI Card Recommendations

Real contract is generated at `/docs` (OpenAPI). All ids are UUID7.

## GET /card/recommendations/{user_id}  (`card_recommendations`)

- **Summary**: Get up to 10 recommended cards for a user.
- **Description**: Draws up to 50 random cards the user has not answered, evaluates them with the
  Jev model using the user's earlier right (interested) and left (not interested) answers, and
  returns the 10 best matches in ranked order. Returns fewer cards when fewer candidates exist and
  an empty list when none exist. If the AI is unavailable the result is up to 10 random candidates.
- **Path**: `user_id` (UUID7), e.g. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Responses**:
  - `200` list of `CardFetchResponse` (0 to 10 items)
  - `422` `ErrorResponse`: invalid `user_id`
- **Example request**: `GET /card/recommendations/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Example response (200)**:

```json
[
  {
    "id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
    "event_name": "Krakow Night Market",
    "color_code": "#FF8800",
    "description": "Street food and live music.",
    "image_url": "/images/night-market.png",
    "starts_at": "2026-11-15T17:00:00Z",
    "ends_at": null,
    "address": "Rynek Glowny 1, Krakow",
    "lat": 50.0617,
    "lng": 19.9373,
    "price": 0
  }
]
```

- **Example response (no candidates)**: `[]`

## Outbound: Jev request (for reference)

`POST https://opencode.ai/zen/v1/systemone`, `Authorization: Bearer $OPENCODE_API_KEY`

```json
{
  "model": "jev-1.13-free",
  "state": {"liked": [], "disliked": [], "candidates": []},
  "questions": {
    "<candidate id>": {
      "type": "noul",
      "instructions": "Given the events this user liked and disliked, will this user be interested in the candidate event with this id?"
    }
  }
}
```

Response used: `answers.<candidate id>.noul` (probability of yes, 0 to 1).

The earlier card endpoints are unchanged.
