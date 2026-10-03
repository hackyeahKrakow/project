# Feature Specification: Sequential Card Feed

**Feature Branch**: `feature/backend_logic`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Add endpoint /card/new/{user_id} with 6 hardcoded cards (numbered 1 to 6). When a user fetches, they receive the cards sequentially, so the backend remembers how many cards the user has already fetched. Use the schemas and DB from before."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get the next card in order (Priority: P1)

A user asks for a new card and receives the next one from a fixed set of six numbered cards. The
first request returns card 1, the second returns card 2, and so on, so the user never sees the
same card twice and always sees them in the same order.

**Why this priority**: It is the whole feature: a working card feed that the frontend can build
the swipe deck on, before real event data and recommendations exist.

**Independent Test**: Request a new card for one user six times in a row and check that cards 1
to 6 come back in that exact order, each with all card details.

**Acceptance Scenarios**:

1. **Given** a user who has never fetched a card, **When** they request a new card, **Then** card
   number 1 is returned with all of its details.
2. **Given** a user who has already received cards 1 to 3, **When** they request a new card,
   **Then** card number 4 is returned.
3. **Given** a user who has already received all six cards, **When** they request a new card,
   **Then** a clear "no more cards" outcome is returned instead of a card.

---

### User Story 2 - Progress is remembered per user (Priority: P2)

Each user has their own position in the sequence. The service remembers it between requests (and
after a restart), so one user fetching cards does not change what another user receives.

**Why this priority**: Without per-user memory the order would be shared or reset, and the feed
would be meaningless with more than one user. It builds on the sequence from User Story 1.

**Independent Test**: Fetch two cards for user A, then fetch a card for user B and check B
receives card 1; fetch again for A and check A receives card 3.

**Acceptance Scenarios**:

1. **Given** user A has received cards 1 and 2, **When** user B requests a new card for the first
   time, **Then** user B receives card 1.
2. **Given** user A has received cards 1 and 2, **When** user B has fetched cards in the
   meantime, **Then** user A's next card is still card 3.
3. **Given** the service was restarted after a user received card 2, **When** that user requests
   a new card, **Then** card 3 is returned.

---

### Edge Cases

- What happens when a user id is not a valid identifier? A clear validation error is returned and
  no progress is recorded.
- What happens when two requests for the same user arrive at the same time? Each request receives
  a different card, with no card skipped or given twice.
- What happens when the user has received all six cards? Every further request returns the same
  "no more cards" outcome and does not change the user's progress.
- What happens when a user is seen for the first time? They are treated as a new user starting at
  card 1; no registration is needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "new card" endpoint that, given a user identifier,
  returns one card.
- **FR-002**: The system MUST have exactly six predefined cards, numbered 1 to 6, with fixed
  identifiers and fixed contents.
- **FR-003**: The system MUST return the cards to each user in ascending number order, starting
  with card 1.
- **FR-004**: The system MUST remember, per user, which cards have already been returned, so the
  next request returns the next card in order.
- **FR-005**: A card returned to a user MUST NOT be returned to that same user again.
- **FR-006**: Progress of one user MUST NOT affect the cards returned to any other user.
- **FR-007**: Progress MUST survive a service restart.
- **FR-008**: When the user has already received all six cards, the system MUST return a clear
  "no more cards" outcome.
- **FR-009**: The returned card MUST use the existing card format (identifier, event name, color
  code, description, image, start and end time, address, coordinates, price) documented in the
  API contract.
- **FR-010**: An invalid user identifier MUST produce a clear, consistent error response and MUST
  NOT change any user's progress.
- **FR-011**: The existing card endpoints from the previous feature MUST keep working as before.

### Key Entities *(include if feature involves data)*

- **Card**: An event card as already defined; six predefined cards numbered 1 to 6 exist.
- **User Progress**: For each user, how many cards (or which card number) they have already
  received. Created the first time a user requests a card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who requests a new card six times receives all six cards, each exactly once,
  in order 1 to 6, in 100% of tries.
- **SC-002**: With two users fetching alternately, each of them receives their own complete
  sequence 1 to 6 without gaps or repeats.
- **SC-003**: After a service restart, 100% of users continue from the card after the last one
  they received.
- **SC-004**: A new card is delivered in under 1 second.
- **SC-005**: 100% of requests with an invalid user identifier receive a clear error and leave
  all users' progress unchanged.

## Assumptions

- The six cards are fixed sample data for now; real events and recommendations come in a later
  feature. Their contents are written by the team and may be changed without changing the logic.
- Progress advances every time a card is returned, whether or not the user responds to it.
- After card 6 there is no cycling back to card 1; the user gets the "no more cards" outcome.
- There is no login: the user identifier in the request is trusted, and an identifier not seen
  before is a new user (as in the previous feature).
- The endpoint is a new, separate one; the two earlier card endpoints stay as skeletons and are
  not changed here.
- Progress is stored in the existing SQLite database and the card format reuses the existing
  schemas; the exact tables are decided in the planning phase.
