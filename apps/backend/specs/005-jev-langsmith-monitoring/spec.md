# Feature Specification: Jev Monitoring with LangSmith

**Feature Branch**: `feature/jev_langsmith_monitoring`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Use LangSmith to implement monitoring for Jev (the API key is supplied separately, it is not part of this specification). Don't overcomplicate it. Make sure not to change any backend logic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See every Jev call in LangSmith (Priority: P1)

When recommendations are computed and the service asks Jev which cards fit a user, the team can open
LangSmith and see that call: when it happened, how long it took, which model answered, how many
cards were scored, how many cards the user had liked and disliked, and whether the call worked. When
it failed, the trace says why (for example timeout, rejected key, invalid answer) and that the user
got random cards instead.

**Why this priority**: Recommendations depend on an outside AI the team does not control. Today a
Jev failure is only a log line and the user silently gets random cards, so nobody can tell how often
Jev works, how slow it is, or whether its scores make sense.

**Independent Test**: With monitoring on, request recommendations for a user who has answered some
cards, then open the LangSmith project and check that exactly one new trace shows the call with its
duration, model, card counts, outcome and the scores returned.

**Acceptance Scenarios**:

1. **Given** monitoring is on and a user has answered cards, **When** recommendations are requested
   and Jev answers, **Then** one trace appears with the duration, the model, the number of
   candidate cards, the numbers of liked and disliked cards, outcome "success" and the score for
   each candidate card.
2. **Given** monitoring is on and Jev fails (timeout, rejected key or an unusable answer), **When**
   recommendations are requested, **Then** one trace appears with outcome "failed" and the reason,
   and the user still receives the usual random fallback cards.
3. **Given** monitoring is on and a user has no answers and no saved choices, **When**
   recommendations are requested, **Then** no trace appears, because Jev was not asked.

---

### User Story 2 - Monitoring never changes how the app behaves (Priority: P1)

Turning monitoring on, off, or breaking it has no effect on what users get. The same request returns
the same cards in the same order, with the same status codes and the same fallback rules. If
LangSmith is unreachable, slow, or rejects the key, recommendations are still returned normally.

**Why this priority**: Monitoring is only an observer. It must not be able to slow down or break the
feature it watches, and the request was explicit that no backend logic changes.

**Independent Test**: Request recommendations for the same user and the same Jev answers with
monitoring off, on, and on with LangSmith unreachable. Compare the responses.

**Acceptance Scenarios**:

1. **Given** the same user, cards and Jev answers, **When** recommendations are requested with
   monitoring off and then on, **Then** both responses contain the same cards in the same order.
2. **Given** monitoring is on but LangSmith cannot be reached, **When** recommendations are
   requested, **Then** the response is the same as with monitoring off and arrives without a
   noticeable delay.
3. **Given** no LangSmith key is configured, **When** the service starts and handles requests,
   **Then** monitoring is simply off: no errors, no warnings on every request, and nothing is sent.

---

### User Story 3 - Find failed and slow Jev calls quickly (Priority: P2)

The team can tell production traffic from tests and development, and can narrow the traces to failed
calls or slow calls, so a problem with Jev is noticed and understood in minutes.

**Why this priority**: Traces are only useful if they can be sorted out. It is a small addition on
top of Story 1 but it is what turns a pile of traces into monitoring.

**Independent Test**: Make a few successful and failed calls from two different environments, then
filter the LangSmith project by environment and by outcome.

**Acceptance Scenarios**:

1. **Given** traces from the production and development environments, **When** the team filters by
   environment, **Then** only that environment's traces are shown.
2. **Given** a mix of successful and failed calls, **When** the team filters by outcome "failed",
   **Then** exactly the failed calls are shown, each with its reason.

---

### Edge Cases

- No LangSmith key is configured: monitoring is off and the app behaves exactly as before.
- The LangSmith key is wrong or expired: requests are unaffected; the problem is visible in the
  service logs without breaking anything.
- LangSmith is down or very slow: requests are unaffected and are not held up waiting for it.
- Jev is down, slow or returns an unusable answer: the call is still recorded, as a failure with its
  reason, and users get the usual random fallback.
- A user with a long history: the trace stays a reasonable size and does not make requests slower.
- Many recommendation requests at once: every Jev call gets its own trace and none are mixed up.
- Secrets: neither the Jev key nor the LangSmith key ever appears in a trace or a log line.
- The user's identifier and location never appear in a trace (the same rule as for Jev itself).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When monitoring is on, every call the service makes to Jev to score recommendation
  candidates MUST produce exactly one trace in LangSmith.
- **FR-002**: A trace MUST show when the call happened, how long it took, which Jev model was used,
  the number of candidate cards, the numbers of liked and disliked cards, whether the user's saved
  choices were included, the outcome (success or failed), the failure reason when it failed, and the
  score returned for each candidate card.
- **FR-003**: A trace MUST NOT contain the user's identifier, the user's location, or any secret
  (the Jev key, the LangSmith key).
- **FR-004**: [NEEDS CLARIFICATION: should traces also contain the user's own saved choices (the JSON
  sent to POST /info/{user_id}) and the card texts sent to Jev, or only counts, ids, scores and
  timings?]
- **FR-005**: Monitoring MUST NOT change any behavior of the service: the same cards in the same
  order, the same status codes, the same response shapes, the same Jev timeout and the same random
  fallback on failure.
- **FR-006**: A failure of monitoring (LangSmith unreachable, slow, or rejecting the key) MUST NOT
  fail, delay noticeably, or alter any request.
- **FR-007**: Monitoring MUST be on only when a LangSmith key is configured through the service's
  environment settings, and off otherwise. The key MUST NOT be stored in the repository; only a
  placeholder is documented in the example settings file.
- **FR-008**: Traces MUST carry an environment label so production traffic can be told apart from
  development and tests.
- **FR-009**: Monitoring MUST cover Jev only. Other AI features (such as turning a post into an event
  draft) are out of scope.
- **FR-010**: Automated tests MUST run without network access and with monitoring off by default.

### Key Entities

- **Jev call trace**: one record per Jev call made for recommendations. It holds the time and
  duration, the model, the outcome and failure reason, the counts of candidate, liked and disliked
  cards, whether saved choices were included, the score per candidate card, and the environment
  label. It never holds the user's identifier, location or any secret.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of recommendation requests that consult Jev have a visible trace in LangSmith
  within 1 minute.
- **SC-002**: For the same user, cards and Jev answers, the recommendations returned with monitoring
  on are identical to those returned with it off in 100% of tested cases.
- **SC-003**: With LangSmith unreachable, 100% of recommendation requests still succeed and take no
  more than 0.1 second longer than with monitoring off.
- **SC-004**: The team can list every failed Jev call of the last day, with reasons, in under
  1 minute.
- **SC-005**: In a check of 20 traces, none contains a user identifier, a location or a secret.

## Assumptions

- A LangSmith account and project exist, and the key is provided by the team through the service's
  environment settings. The key shared while preparing this specification must be treated as exposed
  and replaced once monitoring works.
- Monitoring is for the team only; end users never see it and it adds nothing to API responses.
- Every Jev call is traced; traffic is small enough that sampling is not needed.
- "Don't overcomplicate it" means: no new endpoints, no new tables, no dashboard of our own, and no
  change to scoring, ordering, timeouts or fallback; LangSmith's own views are the dashboard.
- Production needs the same environment setting configured in Vercel as local development does in
  its `.env` file.
- Recommendations are the only place Jev is called, so they are the only place that needs tracing.
