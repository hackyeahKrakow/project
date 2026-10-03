# Data Model: AI Card Recommendations

No new tables and no schema changes. The feature only reads existing data.

## Used: Card (table `cards`)

Source of the candidate pool and of the card details in the response. See
`specs/001-card-swipe-api/data-model.md`.

## Used: CardResponse (table `card_responses`)

`(user_id, card_id, decision)`. Two uses:
- Exclusion: candidates exclude every `card_id` the user has a row for.
- History: rows with `decision = right` form the "liked" list, `left` the "disliked" list.

## Transient (not stored): Recommendation

| Field | Type | Rules |
|-------|------|-------|
| items | list of Card | 0 to 10 distinct cards, all from the candidate pool, in ranked order |

## Transient: Jev request state

```json
{
  "liked": [{"id": "...", "event_name": "...", "description": "...", "price": 0, "address": "..."}],
  "disliked": [{"id": "...", "event_name": "...", "description": "...", "price": 0, "address": "..."}],
  "candidates": [{"id": "...", "event_name": "...", "description": "...", "price": 0, "address": "..."}]
}
```

- `description` trimmed to 150 characters.
- The user id is never included.
- One `noul` question per candidate, keyed by the candidate id.
- State plus questions stay under about 20,000 estimated tokens (limit 32,000); history is trimmed
  at random if needed.

## Schemas

No new schema: the endpoint returns `list[CardFetchResponse]`; errors use `ErrorResponse`.
