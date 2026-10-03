# Feature Specification: AI Card Recommendations

**Feature Branch**: `feature/rec_algorithm`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Use 'jev' from typesafe ai (an AI tool; exact name to be confirmed) to choose 10 cards out of 50 cards randomly pulled from the DB. It also fetches all cards the user has answered (right = interested in the event, left = not interested). If there are fewer than 50 cards it must not throw an error. The AI evaluates and chooses only 10 for the user_id."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get 10 recommended cards for a user (Priority: P1)

For a given user, the system pulls up to 50 random cards from the card database, looks at the
user's earlier swipe answers (right = interested, left = not interested), and uses an AI model to
evaluate the cards and choose the 10 that fit this user best. The user receives those 10 cards.

**Why this priority**: This is the whole feature: a short, personalized list of cards instead of an
arbitrary one.

**Independent Test**: With at least 50 cards in the database and a user who has answered several
cards, request recommendations and check that exactly 10 distinct cards come back, all from the
candidate pool, none of which the user has already answered.

**Acceptance Scenarios**:

1. **Given** 50 or more cards the user has not answered, **When** recommendations are requested,
   **Then** exactly 10 distinct cards are returned.
2. **Given** a user who answered right on several cards of one kind and left on others, **When**
   recommendations are requested, **Then** the AI is given those answers and the chosen cards
   reflect the stated preferences (for example, more of the kind answered right).
3. **Given** a user who has never answered a card, **When** recommendations are requested, **Then**
   10 cards are still returned.

---

### User Story 2 - Works with few cards and never fails on small data (Priority: P2)

When the database has fewer than 50 usable cards, the system uses the cards it has and does not
fail. When fewer than 10 are available, all of them are returned.

**Why this priority**: Real and demo databases are small; an error here would break the swipe flow.

**Independent Test**: With 7 cards in the database, request recommendations and check that all 7
are returned without any error; with 0 usable cards check that an empty result is returned.

**Acceptance Scenarios**:

1. **Given** 30 cards the user has not answered, **When** recommendations are requested, **Then**
   10 cards are chosen from those 30 without an error.
2. **Given** only 6 cards the user has not answered, **When** recommendations are requested,
   **Then** all 6 are returned without an error.
3. **Given** no cards the user has not answered, **When** recommendations are requested, **Then**
   an empty result is returned without an error.

---

### User Story 3 - A bad AI answer never breaks or pollutes the result (Priority: P3)

The AI's answer is checked before use. If the AI is unavailable, answers too slowly, or returns
something invalid (cards not in the candidate pool, duplicates, more than 10), the user still gets
a valid list.

**Why this priority**: AI services fail; the user-facing result must stay reliable and trustworthy.

**Independent Test**: Simulate an unavailable AI and an AI that returns unknown or duplicate cards,
and check that the user still receives up to 10 valid cards from the candidate pool.

**Acceptance Scenarios**:

1. **Given** the AI service is unavailable, **When** recommendations are requested, **Then** up to
   10 cards from the candidate pool are still returned.
2. **Given** the AI returns a card that is not in the candidate pool, **When** the answer is
   checked, **Then** that card is discarded and never shown to the user.
3. **Given** the AI returns fewer than 10 valid cards while more candidates exist, **When** the
   answer is checked, **Then** the list is filled up from the remaining candidates to 10.

---

### Edge Cases

- What happens when the user id is not a valid identifier? A clear validation error is returned
  and the AI is not called.
- What happens when the user answered every card in the database? No candidates remain, so an
  empty result is returned without an error.
- What happens when the AI returns duplicate cards? Duplicates are removed.
- What happens when the AI returns more than 10 cards? Only the first 10 valid ones are kept.
- What happens when two requests for the same user run at once? Each gets a valid list; the lists
  may differ because candidates are drawn randomly.
- What happens when the answer takes very long? The request stops waiting after a fixed time limit
  and uses the fallback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a way to request recommended cards for a given user
  identifier.
- **FR-002**: The system MUST draw a candidate pool of up to 50 cards at random from the card
  database, excluding cards the user has already answered.
- **FR-003**: When fewer than 50 candidate cards exist, the system MUST use all of them and MUST
  NOT fail.
- **FR-004**: The system MUST load all of the user's earlier answers, each marked right
  (interested in the event) or left (not interested).
- **FR-005**: The system MUST give the candidate cards and the user's answers to an AI model and
  ask it to evaluate the candidates and choose the 10 best fitting this user.
- **FR-006**: The system MUST return at most 10 cards, all distinct and all taken from the
  candidate pool; when fewer than 10 candidates exist, all of them are returned.
- **FR-007**: The system MUST check the AI's answer before using it: unknown cards and duplicates
  are discarded, and the list is capped at 10.
- **FR-008**: If the AI is unavailable, times out or returns an unusable answer, the system MUST
  still return up to 10 cards from the candidate pool instead of an error.
- **FR-009**: The returned cards MUST use the existing card format documented in the API contract.
- **FR-010**: An invalid user identifier MUST produce a clear, consistent error response and MUST
  NOT call the AI.
- **FR-011**: Secrets needed to reach the AI service (such as an API key) MUST come from settings
  and MUST NOT be committed to the repository.
- **FR-012**: The existing card endpoints MUST keep working as before.

### Key Entities *(include if feature involves data)*

- **Card**: An event card as already defined; the source of the candidate pool.
- **Card Response**: A user's earlier answer on a card: right (interested) or left (not
  interested); the preference history given to the AI.
- **Recommendation**: The list of up to 10 distinct cards chosen for one user in one request; it
  is not stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With 50 or more unanswered cards available, 100% of requests return exactly 10
  distinct cards.
- **SC-002**: With fewer than 50 cards, including 0, 100% of requests complete without an error.
- **SC-003**: 100% of cards returned come from the candidate pool and none was already answered by
  that user.
- **SC-004**: When the AI service is unavailable, 100% of requests still return a valid list
  instead of an error.
- **SC-005**: A user receives their recommended cards in under 10 seconds in 95% of requests.
- **SC-006**: No secret value appears in the repository or in logs.

## Assumptions

- "jev from typesafe ai" is taken to mean a type-safe AI tooling library or model service for
  structured AI output. The exact tool is not confirmed and is decided in the planning phase; the
  spec only requires that the AI returns a validated, structured choice.
- The candidate pool excludes cards the user has already answered, so a recommended card is never
  one the user has already swiped.
- When the user has no answers yet, the AI is asked to choose without preferences (effectively an
  arbitrary but valid 10).
- The fallback when the AI fails is to return up to 10 random cards from the candidate pool.
- Recommendations are computed on every request and are not stored; the endpoint shape and path are
  decided in the planning phase.
- No login: the user identifier in the request is trusted, as in earlier features.
- **Governance conflict to resolve before planning**: the project constitution (principle IV, "AI
  under human control") and `docs/ARCHITECTURE.md` say the AI is used only to turn organizer text
  into an event draft and that recommendations are computed by an explicit formula, not by an AI.
  This feature uses an AI to choose recommendations, so the constitution must be amended (or an
  exception agreed by the team) before the plan can pass its constitution check.
