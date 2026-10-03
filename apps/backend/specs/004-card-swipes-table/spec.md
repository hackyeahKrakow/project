# Feature Specification: Card Swipes Table

**Feature Branch**: `feature/card_swipes_table`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Add a table that holds all user answers from POST /card/{user_id}. It has the UUID7 of the original card, the user_id, and the swipe as a boolean value where true is a swipe right and false is a swipe left, plus a datetime that is set when the record is created."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save the user's swipe when they answer a card (Priority: P1)

When a user answers a card with POST /card/{user_id}, the service saves one record of that answer:
which card, which user, whether the user swiped right (interested) or left (not interested), and
when it happened. The user gets a confirmation.

**Why this priority**: Without saved answers the app forgets everything a user swipes, so nothing
else (recommendations, history) can work. Today the answer endpoint saves nothing.

**Independent Test**: Answer one card as a user with a right swipe and another with a left swipe,
then check that two records exist with the correct card, user, right/left value and a creation time.

**Acceptance Scenarios**:

1. **Given** an existing card and a user who has not answered it, **When** the user answers with a
   swipe right, **Then** a record is saved with that card, that user, swipe = true, and a creation
   time, and a confirmation is returned.
2. **Given** an existing card and a user who has not answered it, **When** the user answers with a
   swipe left, **Then** a record is saved with swipe = false.
3. **Given** a user who answered 3 different cards, **When** the records are listed, **Then** all 3
   records exist, one per answered card.

---

### User Story 2 - Records are complete and trustworthy (Priority: P2)

Every saved answer has a creation time set by the service at the moment the record is created, never
supplied by the user. Invalid or repeated answers are rejected and leave the saved data unchanged.

**Why this priority**: The answer history is only useful if it is accurate, ordered in time, and
cannot be corrupted by bad requests.

**Independent Test**: Send answers for an unknown card, with an invalid value, and a repeated answer
for the same card, and check that each is rejected with a clear error and nothing new is saved.

**Acceptance Scenarios**:

1. **Given** a valid answer, **When** it is saved, **Then** its creation time is the time of the
   request (within a few seconds), expressed with a timezone, and the user cannot choose it.
2. **Given** a card that does not exist, **When** the user answers it, **Then** a clear "card not
   found" error is returned and nothing is saved.
3. **Given** a swipe value that is neither right nor left, or an invalid identifier, **When** it is
   submitted, **Then** a clear validation error is returned and nothing is saved.
4. **Given** a user who already answered a card, **When** the same user answers the same card
   again, **Then** a clear "already answered" error is returned and the original record (value and
   time) is unchanged.

---

### User Story 3 - The rest of the app uses the saved answers (Priority: P3)

The saved records are the single source of a user's answer history. The recommendation feature reads
the user's right and left answers from them, and cards a user has already answered are not offered
again.

**Why this priority**: It makes the new table useful and avoids two different answer histories, but
it builds on the records existing first.

**Independent Test**: Save a few right and left answers for a user, request recommendations and check
that answered cards are excluded and the history given to the AI matches the saved answers.

**Acceptance Scenarios**:

1. **Given** a user who answered card A (right) and card B (left), **When** recommendations are
   requested, **Then** neither A nor B is returned and the AI is told A was liked and B was disliked.
2. **Given** a user with no saved answers, **When** recommendations are requested, **Then** they
   behave as for a new user (random cards, no AI call).

---

### Edge Cases

- What happens when two identical answers for the same user and card arrive at the same time? Exactly
  one record is saved and the other request gets the "already answered" error.
- What happens when the same card is answered by two different users? Each user gets their own record.
- What happens when a card is deleted later? Not in scope; cards are not deleted in this version.
- What happens to answers saved before this feature? None exist: the answer endpoint did not save
  anything before, so there is nothing to migrate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store every accepted answer as a record containing: the card's UUID7,
  the user's UUID7, a swipe value, and a creation time.
- **FR-002**: The swipe value MUST be a boolean: true means a swipe right (interested), false means a
  swipe left (not interested).
- **FR-003**: The creation time MUST be set by the system when the record is created, include a
  timezone, and MUST NOT be accepted from the client.
- **FR-004**: POST /card/{user_id} MUST save one record per accepted answer and return a confirmation
  that includes the card, the user and the swipe value.
- **FR-005**: A user MUST be able to answer a given card only once; a repeated answer MUST be
  rejected with a clear error and MUST NOT change the existing record.
- **FR-006**: An answer for a card that does not exist MUST be rejected with a clear error and MUST
  NOT save anything.
- **FR-007**: Invalid identifiers or swipe values MUST be rejected with a clear, consistent error
  response and MUST NOT save anything.
- **FR-008**: Each saved record MUST refer to exactly one existing card.
- **FR-009**: The recommendation feature MUST use these records for the user's right/left history and
  to exclude already answered cards.
- **FR-010**: The saved answers MUST survive a service restart.

### Key Entities *(include if feature involves data)*

- **Card Swipe**: One user's answer to one card. Attributes: card identifier (UUID7), user identifier
  (UUID7), swipe (true = right / interested, false = left / not interested), creation time (set
  automatically, with timezone). A user has at most one Card Swipe per card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of accepted answers appear as exactly one saved record with the correct card, user
  and right/left value.
- **SC-002**: 100% of rejected answers (unknown card, invalid value, repeated answer) leave the saved
  data unchanged and return a clear error.
- **SC-003**: Every saved record has a creation time within 5 seconds of the request that created it.
- **SC-004**: After a service restart, 100% of previously saved answers are still present.
- **SC-005**: Answering a card takes under 1 second.
- **SC-006**: 0 cards that a user has answered are returned to that user by recommendations.

## Assumptions

- The request still describes the swipe in the existing words, `right` or `left`; the service stores
  it as the boolean (right = true, left = false). Whether the request itself should send a boolean is
  decided in planning.
- A user can answer a card only once (as in the earlier card swipe feature); the answer history is
  therefore one record per user and card, not a log of changes.
- The new table takes over the job of the existing answers table (`card_responses`). Since the
  answer endpoint saved nothing so far, no data needs migrating; whether to remove the old table is
  decided in planning.
- No login: the user identifier in the request is trusted, as in earlier features.
- The creation time is stored in UTC with a timezone, like other times in the API.
- The table is created automatically on startup like the existing tables (no migration tool).
- The endpoint `POST /card/{user_id}` is no longer a 501 skeleton after this feature.
