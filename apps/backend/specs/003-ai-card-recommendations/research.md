# Research: AI Card Recommendations

## 1. Which service and model

- **Decision**: TypeSafe Jev 1.13 through OpenCode: `POST https://opencode.ai/zen/v1/systemone`,
  header `Authorization: Bearer $OPENCODE_API_KEY`, model `jev-1.13` (paid, $0.042 per million input
  tokens, output free) or `jev-1.13-free` (free for a limited time, inputs not used for training).
  Default to `jev-1.13-free` for the demo; switch with `JEV_MODEL`.
- **Rationale**: Chosen by the team lead. Jev is a "System One" model: it returns typed
  probabilities, cannot return invalid types, and answers in about 70 to 500 ms. The endpoint and
  model ids were confirmed from OpenCode's docs (the OpenCode Go catalog page does not list Jev;
  the Zen catalog does).
- **Alternatives**: Jev through OpenRouter (`POST https://openrouter.ai/api/alpha/decisions`, model
  `typesafe/jev-1.13`; same body shape), a chat LLM through OpenCode Go with JSON output (slower,
  can return invalid output).

## 2. Request and response shape

- **Decision**: Body `{"model", "state", "questions": {"<id>": {"type": "noul", "instructions":
  "..."}}}`. `state` is a JSON object serialised from the user's history and the candidates. The
  response is `{"answers": {"<id>": {"type": "noul", "noul": <0..1>}}, "usage": {...}}`.
- **Rationale**: Matches the documented Decisions API (shared by OpenCode and OpenRouter). All
  questions in one request are answered in parallel.
- **Risk**: The docs do not state a maximum number of questions per request. 50 yes/no questions is
  expected to be fine; this is checked in the quickstart with a real key, and the fallback covers a
  rejected request.

## 3. How to pick 10 of 50

- **Decision**: One `noul` question per candidate ("Given the events this user liked and
  disliked, will this user be interested in event `<id>`?"). Rank candidates by the returned
  probability of yes (descending), break ties by the random draw order, keep the first 10.
- **Rationale**: Independent probabilities are directly comparable and match the spec's "evaluate
  and choose". A single `choice` question over 50 options would return one distribution that sums
  to 1 and answers "which single event is best", which is a weaker signal for a top-10 list.
- **Alternatives**: One `choice` question with up to 255 options (rejected, above); a `score`
  question (rejected, needs a rubric per event).

## 4. Candidate pool and history

- **Decision**: Candidates: `SELECT cards WHERE id NOT IN (the user's answered card ids) ORDER BY
  random() LIMIT 50`. History: the user's answered cards joined with their decision, split into
  `liked` (right) and `disliked` (left), with compact fields only (id, event name, description
  trimmed to 150 characters, price, address). If the serialised state would exceed about 20,000
  estimated tokens (4 characters per token), shuffle and keep as many history items as fit.
- **Rationale**: The spec asks for all answered cards, but Jev's context is 32,000 tokens, so a
  size guard prevents a rejected request for a user with a very long history.
- **Alternatives**: Sending everything unbounded (rejected: can exceed the limit); summarising
  history with another model call (rejected: complexity).

## 5. Cold start (no history)

- **Decision**: When the user has no answers, skip Jev and return up to 10 random candidates.
- **Rationale**: Without preferences Jev's output carries no signal; skipping saves cost and time and
  still satisfies spec User Story 1, scenario 3.

## 6. Failure handling and validation

- **Decision**: Wrap the call with a timeout (default 8 s, `JEV_TIMEOUT_SECONDS`). Treat a missing API
  key, network error, timeout, non-2xx status, invalid JSON, or an answer set that is empty as
  failure and use the random fallback. Per answer: ignore ids not in the candidate set, values that
  are not numbers in 0..1; candidates without a valid score are appended after the scored ones
  (random order) until there are 10. Log `jev_failed` with the reason only, never the key or the
  prompt.
- **Rationale**: Spec FR-007 and FR-008; the AI must never break or pollute the result.

## 7. Settings and secrets

- **Decision**: Add to `Settings`: `opencode_api_key: SecretStr | None`, `jev_model: str =
  "jev-1.13-free"`, `jev_url: str = "https://opencode.ai/zen/v1/systemone"`, `jev_timeout_seconds:
  float = 8.0`. `.env.example` gets placeholders only (`OPENCODE_API_KEY=`).
- **Rationale**: Constitution (no secrets in git) and spec FR-011.

## 8. Privacy

- **Decision**: Send only card content and decisions, never the `user_id`. Do not store Jev output.
- **Rationale**: Constitution principle III; Jev has no need for the identifier.

## 9. HTTP client and testing

- **Decision**: `httpx.AsyncClient` created per call (or injected) in `JevClient`; tests inject
  `httpx.MockTransport` so no real network or key is needed. The route gets the client through a
  FastAPI dependency (`get_jev_client`) that tests can override. Tests build 60 cards directly in
  the test database.
- **Rationale**: Fast, offline, deterministic tests.

## Open questions (non-blocking, defaults chosen)

1. Constitution principle IV was rewritten to allow Jev recommendations (version left at 1.1.0 on
   request).
2. `docs/API.md` does not list the new endpoint yet; add it when the team agrees on the path.
3. Cards have no `category` field; Jev judges interest from the event name, description, price and
   address. A category field would likely improve results later.
