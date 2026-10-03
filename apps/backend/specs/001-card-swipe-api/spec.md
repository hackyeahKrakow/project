# Feature Specification: Card Swipe API

**Feature Branch**: `feature/card_swipe_endpoints`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Create a few endpoints, for now empty with only descriptions, plus schemas and DB models. Endpoints: /health for a health check; GET /card/{user_id} that gives the user one card (card_fetch); POST /card/{user_id} where the user returns the card with a decision (card_response). A card describes an event: card UUID7, event name, color code, description, advertisement (graphic), date, street/place. A user's response additionally carries the user UUID7 and the decision (swipe right or left). Endpoints must have documented types, a summary, a description and an example request."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check that the service is alive (Priority: P1)

An operator or an automated monitor asks the service whether it is running and receives a simple
confirmation.

**Why this priority**: It is the smallest slice that proves the service is reachable, and every
other endpoint depends on the service being up.

**Independent Test**: Can be fully tested by calling the health endpoint and checking for a
"healthy" confirmation, with no data or user needed.

**Acceptance Scenarios**:

1. **Given** the service is running, **When** the health endpoint is requested, **Then** a
   successful response with a status indicating the service is healthy is returned.

---

### User Story 2 - Receive one event card to decide on (Priority: P2)

A user opens the app and asks for their next card (`card_fetch`). The service returns exactly one
event card containing the event name, color code, description, advertisement graphic, date and
street/place, so the user can decide whether they are interested.

**Why this priority**: It is the first half of the core swipe loop; without a card there is
nothing to respond to.

**Independent Test**: Can be tested by requesting a card for a user identifier and checking that
one card with all required fields is described in the endpoint documentation and example.

**Acceptance Scenarios**:

1. **Given** a user identifier, **When** the user requests a card, **Then** exactly one card with
   its unique identifier, event name, color code, description, advertisement graphic, date and
   street/place is returned.
2. **Given** the user has already responded to every available card, **When** the user requests a
   card, **Then** a clear "no more cards" outcome is returned instead of a card.
3. **Given** a user identifier that is not a valid identifier, **When** the user requests a card,
   **Then** a clear validation error is returned.

---

### User Story 3 - Respond to a card with a swipe decision (Priority: P3)

A user returns the card they were shown together with a decision: swipe right (interested) or
swipe left (not interested) (`card_response`). The service records which user decided what on
which card.

**Why this priority**: It completes the swipe loop and captures the data that gives the product
its value, but it needs a card to exist first.

**Independent Test**: Can be tested by submitting a card identifier and decision for a user
identifier and checking that the endpoint documentation and example describe the accepted input
and the confirmation returned.

**Acceptance Scenarios**:

1. **Given** a user was shown a card, **When** the user submits that card with the decision
   "right", **Then** the decision is recorded for that user and card and a confirmation is
   returned.
2. **Given** a user was shown a card, **When** the user submits that card with the decision
   "left", **Then** the decision is recorded and a confirmation is returned.
3. **Given** a decision that is neither "right" nor "left", **When** it is submitted, **Then** a
   clear validation error is returned and nothing is recorded.
4. **Given** a card identifier that does not exist, **When** it is submitted, **Then** a clear
   "card not found" error is returned.

---

### Edge Cases

- What happens when the same user responds to the same card twice? The second response is
  rejected with a clear error rather than silently overwriting the first decision.
- What happens when no cards exist at all? The fetch returns the same "no more cards" outcome.
- What happens when a color code is not a valid color? It is rejected when cards are created or
  imported, so served cards always carry a valid color code.
- What happens when a card has no advertisement graphic? The graphic is a required field of a
  card; cards without one are not served.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a health check endpoint that reports whether the service is
  running.
- **FR-002**: The system MUST provide a `card_fetch` endpoint that, given a user identifier,
  returns one card the user has not yet responded to.
- **FR-003**: The system MUST provide a `card_response` endpoint that, given a user identifier, a
  card identifier and a decision, records the user's decision for that card.
- **FR-004**: A decision MUST be exactly one of two values: swipe right or swipe left.
- **FR-005**: A card MUST consist of: unique identifier (UUID7), event name, color code,
  description, advertisement graphic, event date and street/place.
- **FR-006**: A recorded response MUST consist of: card identifier, user identifier (both
  UUID7) and the decision.
- **FR-007**: Every endpoint MUST be documented with its input and output types, a short summary,
  a longer description and an example request (and example response).
- **FR-008**: For this first version the endpoints MUST be empty skeletons: they declare their
  contract and documentation but do not yet contain real business logic.
- **FR-009**: Input validation errors (malformed identifiers, unknown decision values) MUST
  produce clear, consistent error responses.
- **FR-010**: The data model for cards and responses MUST be defined so it can be persisted, with a
  response linked to exactly one card and one user.

### Key Entities *(include if feature involves data)*

- **Card**: An event shown to users. Attributes: unique identifier (UUID7), event name, color
  code, description, advertisement graphic, event date, street/place.
- **Card Response**: A user's decision on a card. Attributes: card identifier, user identifier
  (UUID7), decision (right or left). Relates to exactly one Card; a user has at most one response
  per card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can confirm the service is running with a single request that answers
  in under 1 second.
- **SC-002**: 100% of the endpoints in this feature appear in the generated API documentation
  with a summary, a description, typed input/output and an example request.
- **SC-003**: A new team member can find and understand the full card and response data shape
  from the documentation alone, without reading the code.
- **SC-004**: 100% of invalid requests (malformed identifier, unknown decision) receive a clear
  error response instead of a failure or a silent acceptance.

## Assumptions

- The app has no login in this version: the user identifier supplied in the request is trusted and
  identifies the user. Authentication is out of scope.
- A user identifier that has not been seen before is treated as a new user with every card
  available; no separate user record is created in this feature.
- Which card is served next (ordering, personalization) is out of scope; a simple "next card the
  user has not responded to" rule is assumed for later implementation.
- The advertisement graphic is stored and exchanged as a reference to an image (not the image
  data itself), and the event date is a calendar date.
- Decision values are named `right` and `left`, and the color code is a hex color such as
  `#FF8800`.
- Data will be stored in SQLite using SQLAlchemy (chosen by the team); this is recorded for the
  planning phase.
- Endpoints stay empty skeletons in this feature; real behavior (database reads and writes) will
  be implemented in a later feature.
- All work stays inside the backend application directory.
