# Data Model: Basic Jev Checks in LangSmith

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

## No database change

Nothing is stored in our database. No tables, no columns, no migration. The only stored data are the
situations file in the repository and, in LangSmith, one dataset and one experiment per run.

## Entity: Jev situation (a JSON object in `scripts/jev_check_cases.json`)

| Field | Type | Rule |
|-------|------|------|
| `name` | string | required, unique, short (it names the situation in the output and in LangSmith) |
| `liked` | list of cards | may be empty |
| `disliked` | list of cards | may be empty |
| `candidates` | list of cards | required, at least 2, card names unique within the situation |
| `expected` | string | required, must equal the `name` of one candidate |

A **card** is `{"name": string, "description": string}`, nothing else. Any other key, on a situation or on a
card, is rejected (it is how real user data would sneak in). The file holds 5 to 10 situations.

### How a situation becomes the request

The script builds the same state shape as the recommender (`liked`, `disliked`, `candidates`; `choices` only
if added later) so Jev sees what it sees in production: every card becomes
`{"id", "event_name", "description", "price": null, "address": null}`, where `id` is `c1`, `c2`, ... within
the situation. No user identifier, no location, no saved choices.

## Entity: Check result (in memory, printed)

| Field | Meaning |
|-------|---------|
| `situation` | the name |
| `status` | `passed`, `failed` or `error` |
| `scores` | `{candidate name: probability}` as Jev returned them; empty on error |
| `reason` | for `failed` the comment (for example `tie` or `top was <name>`); for `error` the Jev reason code |
| `seconds` | duration of the Jev call |

The total is `passed` out of `passed + failed`, with the number of errors shown separately.

## Entity: dataset and experiment in LangSmith

| Part | Value |
|------|-------|
| Dataset | `spotted-jev-checks`; one example per situation, id = `uuid5(name)`, inputs = the situation without `expected`, outputs = `{"expected": name}` |
| Experiment | one project per run named `jev-check-<suffix>`, one run per situation |
| Feedback | key `winner_on_top`, score 1 or 0, comment with the scores; none for an errored run |

## State transitions

None. A run reads the file, syncs the dataset, calls Jev once per situation, reports. It leaves nothing
behind except the experiment.
