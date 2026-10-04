# Feature Specification: Basic Jev Checks in LangSmith

**Feature Branch**: `feature/jev_langsmith_tests`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Add Jev tests using LangSmith, something simple and basic that does not use up much of the LangSmith limits."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check on demand that Jev still picks sensible cards (Priority: P1)

A developer wants to know whether Jev's recommendations still make sense, for example after the model
name changes, after the instruction text sent to Jev changes, or when the free model is replaced. They
run one command. A small, fixed set of made-up situations is sent to the real Jev ("this user liked
metal concerts and disliked walks; which of these three events fits?"). Each situation has an obvious
expected answer. The developer sees a short pass/fail result per situation and a total, and can open
the same run in LangSmith.

**Why this priority**: Today the only automated Jev tests use a fake Jev, so they prove the plumbing
but say nothing about whether the real model gives useful scores. This is the whole point of the
request.

**Independent Test**: Run the check with the Jev and LangSmith keys present and confirm that every
situation prints a result, that the total is shown, and that the run appears in LangSmith as one
experiment.

**Acceptance Scenarios**:

1. **Given** the Jev key and the LangSmith key are configured, **When** the developer runs the check,
   **Then** each fixed situation is sent to Jev once and the result for it (pass or fail, with the
   scores Jev gave) is shown, followed by a total such as "6 of 7 passed".
2. **Given** a situation where the user clearly liked one kind of event, **When** Jev scores one
   matching and one unrelated candidate, **Then** the situation passes only if the matching event gets
   the higher score.
3. **Given** Jev is down, slow or rejects the key during the check, **When** the check runs, **Then**
   the affected situation is reported as "error" (not "failed", so it is not mistaken for a bad
   recommendation) and the other situations still run.
4. **Given** the same situations are run twice, **When** the results are compared, **Then** the
   developer can see in LangSmith both runs side by side under the same name.

---

### User Story 2 - The check never runs by accident or burns the limits (Priority: P1)

The check does not run in the normal automated test run, does not run on every code change, and does
not need to be repeated to be useful. It uses a handful of situations and nothing else, so the
LangSmith free allowance and the Jev free model stay available for real monitoring.

**Why this priority**: The request is explicit that it must not use up much of the LangSmith limits.
LangSmith already receives a trace per real recommendation (feature 005); a careless evaluation could
crowd those out.

**Independent Test**: Run the normal test suite without any keys and check it passes with no network
use and no evaluation. Then run the check once and count what reached LangSmith.

**Acceptance Scenarios**:

1. **Given** no keys are set, **When** the normal automated tests run, **Then** they pass without any
   network access and the Jev check is not executed.
2. **Given** the keys are set, **When** the normal automated tests run, **Then** the Jev check is
   still not executed; it only runs when the developer asks for it.
3. **Given** one run of the check, **When** the usage is counted, **Then** it sent at most one trace per
   situation plus the single experiment record, and nothing else.
4. **Given** the Jev key or the LangSmith key is missing, **When** the developer starts the check,
   **Then** it stops right away and says which key is missing, without sending anything.

---

### User Story 3 - Add or change a situation in one place (Priority: P3)

The situations live in one small, readable list in the repository. Adding a new one means adding one
entry: the liked and disliked events, the candidates, and which candidate should win. Nothing has to
be changed in LangSmith by hand.

**Why this priority**: The checks only stay useful if they are cheap to extend when a recommendation
bug is found, but the first version is useful without this.

**Independent Test**: Add one entry to the list, run the check, and see it appear with its result.

**Acceptance Scenarios**:

1. **Given** a new entry in the list, **When** the check runs, **Then** it is evaluated like the others
   and listed in the results and in LangSmith.
2. **Given** an entry that is malformed (for example the expected winner is not among the candidates),
   **When** the check starts, **Then** it names the entry and stops before sending anything.

---

### Edge Cases

- Jev gives the matching and the unrelated candidate exactly the same score: the situation fails
  (a tie is not a recommendation) and the result says so.
- Jev scores are close (for example 0.52 against 0.50): the situation passes if the order is right;
  the check does not set a minimum gap in the first version.
- LangSmith is unreachable while the check runs: the check still prints the results locally and says
  that the upload failed. Results are never lost because of LangSmith.
- The free Jev model is rate limited: the affected situations are reported as "error", the check does
  not retry in a loop.
- The check is started from a machine whose `.env` has a production LangSmith project: results go to
  their own project, never mixed with the production traces of real users.
- Secrets: neither key appears in the output, in the results or in anything sent to LangSmith.
- Personal data: the situations are invented. No real user identifier, location, saved choices or real
  swipe history is used or sent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST contain a small fixed set of made-up Jev situations (between 5 and 10),
  each with liked events, disliked events, candidate events and the candidate that is expected to get
  the highest score.
- **FR-002**: A developer MUST be able to run all situations against the real Jev with one command,
  and the command MUST print, per situation, the scores Jev returned and whether it passed, failed or
  errored, plus a total.
- **FR-003**: A situation MUST pass only when the expected candidate gets a strictly higher score than
  every other candidate in that situation.
- **FR-004**: A Jev failure (timeout, rejected key, unusable answer) MUST be reported as "error" for
  that situation and MUST NOT stop the other situations or count as a failed recommendation.
- **FR-005**: The results of a run MUST be recorded in LangSmith as one named experiment over a
  dataset made from the situations, so two runs can be compared side by side.
- **FR-006**: The check MUST send at most one Jev request per situation and MUST NOT repeat situations
  or retry failed ones within a run.
- **FR-007**: The check MUST NOT run as part of the normal automated test run, with or without keys;
  the normal test run MUST keep passing offline.
- **FR-008**: The check MUST refuse to start, naming what is missing, when the Jev key or the
  LangSmith key is not configured, and MUST send nothing in that case.
- **FR-009**: Results MUST go to a LangSmith project separate from the one used for real traffic
  monitoring, and the separation MUST NOT depend on the developer remembering to change a setting.
- **FR-010**: A malformed situation MUST be detected before anything is sent and reported by name.
- **FR-011**: The check MUST NOT change any behavior of the service: it is an addition used by
  developers, not part of request handling, and no recommendation logic, scoring, ordering, timeout
  or fallback changes.
- **FR-012**: Neither the Jev key nor the LangSmith key MUST appear in output or in LangSmith; the keys
  come only from the environment, and no real key is stored in the repository.
- **FR-013**: The situations MUST use only invented events and invented users; they MUST NOT contain a
  real user identifier, location or saved choices.
- **FR-014**: If the upload to LangSmith fails, the check MUST still print the full results locally
  and MUST say that the upload failed.

### Key Entities

- **Jev situation**: one made-up test case. It has a short name, the events the user liked, the events
  the user disliked, two or more candidate events, and the candidate expected to win.
- **Check run**: one execution over all situations. It has a name that identifies it, one result per
  situation (passed, failed or error, with the scores), and a total.
- **Experiment in LangSmith**: the stored record of a check run, linked to the dataset of situations,
  so that runs can be compared.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can run the check and read its verdict in under 2 minutes from a clean
  start, with a single command.
- **SC-002**: One run sends no more than 10 situations' worth of traces to LangSmith (at most 10 Jev
  calls) plus the single experiment record, so 10 runs a day stay well below the free monthly
  allowance of traces.
- **SC-003**: The normal automated test run makes 0 network calls and 0 LangSmith uploads in 100% of
  runs, with or without keys present.
- **SC-004**: When the check reports a failed situation, a developer can see which candidate Jev
  preferred and the scores in under 1 minute, in the output or in LangSmith.
- **SC-005**: In a check of one full run, no trace or output contains a key, a user identifier, a
  location or saved choices.
- **SC-006**: Adding one new situation takes one entry in one file and no change anywhere else.

## Assumptions

- The check is run by hand by a developer (after changing the model, the instruction text or the way
  the state is built, and from time to time); it is not run on every commit and not in CI. Scheduling
  it is a possible later step and out of scope here.
- "Tests" here means quality checks of Jev's answers on invented situations, with one correct answer
  each. It does not mean replacing the existing offline tests that use a fake Jev; those stay as they
  are.
- LangSmith is already available from feature 005 (key, region and settings); this feature reuses
  them and adds no new account or key.
- The Jev free model is used by default, as in the service; results can vary a little between runs,
  so a situation is only included when its expected answer is clear to a person.
- Results are for the team only; end users never see them, and no new endpoint, table or screen is
  added.
- "Don't use up much of the limits" is read as: a handful of situations, one run at a time, no
  repetition, no automatic runs, and one Jev call per situation.
