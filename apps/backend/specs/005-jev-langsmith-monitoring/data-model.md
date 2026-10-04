# Data Model: Jev Monitoring with LangSmith

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

## No database change

Monitoring stores nothing in our database. There are no new tables, no new columns and no migration.
The only new data lives in LangSmith, one trace per Jev call, and in three optional settings.

## Entity: Jev call trace (lives in LangSmith)

One record per call made by `score_interest`. Where each part of the spec's "Jev call trace" ends up:

| Spec part | Trace field | Source | Rule |
|-----------|-------------|--------|------|
| Time of the call, duration | run start and end time | set by LangSmith | none |
| Model | inputs `model`; metadata `model` | `JevClient._model` | none |
| Outcome | metadata `outcome` = `success` or `failed` | set around the call | only these two values |
| Failure reason | metadata `reason` | the `JevError` message | only the safe reason codes already used by `JevClient` |
| Number of candidates | metadata `candidates` | `len(state["candidates"])` | integer |
| Number of liked and disliked cards | metadata `liked`, `disliked` | lengths of the state lists | integers |
| Saved choices included | inputs `choices_included`; metadata `has_choices` | `"choices" in state` | boolean only, never the content |
| Card names and descriptions | inputs `candidates` | the compact cards sent to Jev: id, event_name, description, price, address | public demo data, as sent |
| Liked and disliked cards | inputs `liked`, `disliked` | id and event_name only | keeps big histories small |
| Score per candidate | outputs `scores` | `{card_id: probability}` returned by Jev | none |
| Environment label | tag | the existing `environment` setting | one tag |
| Project | project name | `langsmith_project` | default `spotted-jev` |

### Never present in a trace

The user's identifier, location, the content of the saved choices, the Jev key, the LangSmith key.
The recommender's state has no user identifier to begin with; the Jev key sits on the client object,
which the SDK does not capture; the choices content is dropped by the input filter.

### Size

Candidates: at most 50 cards (about 300 characters each). Liked and disliked: id and name only, so a
long history adds only a few kilobytes. A typical trace stays well under 30 KB.

### State transitions

None. A trace is written once per call: created when the call starts and completed when it ends,
either with scores (success) or with an error (failed). A request that never calls Jev (user with no
answers and no choices) writes nothing.

## Settings (new, all optional)

| Setting | Default | Meaning |
|---------|---------|---------|
| `langsmith_api_key` | empty | Monitoring is on only when it is set. Secret; never in the repository. |
| `langsmith_project` | `spotted-jev` | The LangSmith project the traces go to. |
| `langsmith_endpoint` | empty | Empty means the SDK default (US). Set it for an EU account. |

The environment label is not new: it reuses the existing `environment` setting.
