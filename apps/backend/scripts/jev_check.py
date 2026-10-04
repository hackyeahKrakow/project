"""Check on demand that Jev still picks sensible cards, and record the run in LangSmith.

Sends the made-up situations of scripts/jev_check_cases.json to the real Jev, one request per situation,
and passes a situation only if the expected candidate gets the strictly highest score. The run is stored
in LangSmith as one experiment over the dataset `spotted-jev-checks`. Run from apps/backend:

    uv run python -m scripts.jev_check             # all situations against the real Jev
    uv run python -m scripts.jev_check --dry-run   # validate the file and list the situations, send nothing

Exit codes: 0 every situation passed, 1 at least one failed or errored, 2 could not start (nothing sent).
Keys come from the environment or .env (OPENCODE_API_KEY, LANGSMITH_API_KEY); they are never printed.
"""

import argparse
import asyncio
import json
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from langsmith import evaluate

from app.config import get_settings
from app.jev_client import JevClient, JevError
from app.monitoring import build_tracing_client

CASES_PATH = Path(__file__).with_name("jev_check_cases.json")
DATASET_NAME = "spotted-jev-checks"
EXPERIMENT_PREFIX = "jev-check"
MIN_CASES = 5
MAX_CASES = 10

# Stable ids make a repeated run update the same dataset examples instead of adding duplicates.
_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, DATASET_NAME)

_CASE_KEYS = {"name", "liked", "disliked", "candidates", "expected"}
_CARD_KEYS = {"name", "description"}
_MAX_NAME_LENGTH = 60


class CaseError(Exception):
    """The cases file is not usable. The message names the situation, never a value of a key."""


@dataclass
class CheckResult:
    situation: str
    status: str  # "passed", "failed" or "error"
    scores: dict[str, float] = field(default_factory=dict)  # candidate name -> probability
    reason: str = ""  # the comment of a failed situation, or the Jev reason code of an error
    seconds: float = 0.0


# --- the situations file -------------------------------------------------------------------------


def _check_cards(label: str, cards: Any, *, at_least: int = 0) -> None:
    if not isinstance(cards, list) or len(cards) < at_least:
        raise CaseError(f"{label}: needs a list of at least {at_least} cards")
    for card in cards:
        if not isinstance(card, dict):
            raise CaseError(f"{label}: a card must be an object with a name and a description")
        # Only these two keys: it is what keeps real user data out of what is sent to Jev and LangSmith.
        extra = sorted(set(card) - _CARD_KEYS)
        if extra:
            raise CaseError(f"{label}: a card has keys that are not allowed: {', '.join(extra)}")
        for key in _CARD_KEYS:
            if not isinstance(card.get(key), str) or not card[key].strip():
                raise CaseError(f"{label}: every card needs a non-empty {key}")


def load_cases(path: Path) -> list[dict]:
    """Read and validate the situations. Raises CaseError on the first problem, before anything is sent."""
    path = Path(path)
    try:
        cases = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise CaseError(f"{path.name}: cannot be read as JSON ({type(exc).__name__})") from None
    if not isinstance(cases, list) or not MIN_CASES <= len(cases) <= MAX_CASES:
        raise CaseError(f"{path.name}: needs between {MIN_CASES} and {MAX_CASES} situations")

    seen: set[str] = set()
    checked = []
    for index, case in enumerate(cases, start=1):
        name = case.get("name") if isinstance(case, dict) else None
        usable = isinstance(name, str) and name.strip() and len(name) <= _MAX_NAME_LENGTH
        label = f"situation '{name}'" if usable else f"situation #{index}"
        if not isinstance(case, dict):
            raise CaseError(f"{label}: must be an object")
        extra = sorted(set(case) - _CASE_KEYS)
        if extra:
            raise CaseError(f"{label}: has keys that are not allowed: {', '.join(extra)}")
        if not usable:
            raise CaseError(f"{label}: needs a short name (at most {_MAX_NAME_LENGTH} characters)")
        if name in seen:
            raise CaseError(f"{label}: the name is used twice")
        seen.add(name)

        liked, disliked = case.get("liked", []), case.get("disliked", [])
        _check_cards(f"{label} liked", liked)
        _check_cards(f"{label} disliked", disliked)
        _check_cards(f"{label} candidates", case.get("candidates"), at_least=2)
        names = [card["name"] for card in case["candidates"]]
        if len(set(names)) != len(names):
            raise CaseError(f"{label}: candidate names must be unique")
        if case.get("expected") not in names:
            raise CaseError(f"{label}: 'expected' must be the name of one of its candidates")
        checked.append({**case, "liked": liked, "disliked": disliked})
    return checked


def _card(card_id: str, card: dict) -> dict:
    # The same shape the recommender sends (app/recommender.py::_compact), so Jev sees what it sees in production.
    return {
        "id": card_id,
        "event_name": card["name"],
        "description": card["description"],
        "price": None,
        "address": None,
    }


def build_state(case: dict) -> dict:
    """The state Jev receives: liked, disliked and candidate cards, nothing that identifies a user."""
    return {
        "liked": [_card(f"l{i}", c) for i, c in enumerate(case["liked"], start=1)],
        "disliked": [_card(f"d{i}", c) for i, c in enumerate(case["disliked"], start=1)],
        "candidates": [_card(f"c{i}", c) for i, c in enumerate(case["candidates"], start=1)],
    }


def candidate_names(case: dict) -> dict[str, str]:
    return {f"c{i}": c["name"] for i, c in enumerate(case["candidates"], start=1)}


def expected_id(case: dict) -> str:
    return next(card_id for card_id, name in candidate_names(case).items() if name == case["expected"])


def top_candidate_wins(scores: dict[str, float], expected: str) -> tuple[bool, str]:
    """Pass only if the expected candidate has a score strictly above every other scored candidate."""
    if expected not in scores:
        return False, "no score for the expected candidate"
    others = {name: score for name, score in scores.items() if name != expected}
    if not others:
        return True, f"{expected} on top"
    best = max(others, key=others.get)
    if scores[expected] > others[best]:
        return True, f"{expected} on top"
    if scores[expected] == others[best]:
        return False, f"tie at {scores[expected]:.2f} between {expected} and {best}"
    return False, f"top was {best} ({others[best]:.2f})"


# --- running the situations -----------------------------------------------------------------------


async def run_situation(jev: JevClient, case: dict) -> CheckResult:
    """Ask Jev once about one situation. A Jev failure becomes an `error` result, never a retry."""
    names = candidate_names(case)
    started = time.perf_counter()
    try:
        by_id = await jev.score_interest(build_state(case), list(names))
    except JevError as exc:  # its message is a safe reason code such as http_429 or timeout
        return CheckResult(case["name"], "error", reason=str(exc), seconds=time.perf_counter() - started)
    seconds = time.perf_counter() - started
    scores = {names[card_id]: score for card_id, score in by_id.items() if card_id in names}
    passed, comment = top_candidate_wins(scores, case["expected"])
    return CheckResult(case["name"], "passed" if passed else "failed", scores, "" if passed else comment, seconds)


def run_local(jev: JevClient, cases: list[dict]) -> list[CheckResult]:
    return [asyncio.run(run_situation(jev, case)) for case in cases]


_LABELS = {"passed": "PASS", "failed": "FAIL", "error": "ERROR"}


def _scores_text(scores: dict[str, float]) -> str:
    return "  ".join(f"{name} {score:.2f}" for name, score in scores.items())


def format_report(results: list[CheckResult]) -> str:
    width = max((len(r.situation) for r in results), default=0)
    lines = []
    for r in results:
        if r.status == "passed":
            detail = _scores_text(r.scores)
        elif r.status == "failed":
            detail = f"{r.reason}  [{_scores_text(r.scores)}]"
        else:
            detail = r.reason
        lines.append(f" {_LABELS[r.status]:<5} {r.situation:<{width}}  {detail}")
    passed = sum(r.status == "passed" for r in results)
    failed = sum(r.status == "failed" for r in results)
    errors = sum(r.status == "error" for r in results)
    summary = f"passed {passed} of {passed + failed}"
    if errors:
        summary += f" ({errors} error{'s' if errors != 1 else ''})"
    return "\n".join([*lines, summary])


def exit_code(results: list[CheckResult]) -> int:
    return 0 if results and all(r.status == "passed" for r in results) else 1


# --- LangSmith ------------------------------------------------------------------------------------


def _example_id(case: dict) -> uuid.UUID:
    return uuid.uuid5(_NAMESPACE, case["name"])


def _inputs(case: dict) -> dict:
    return {key: value for key, value in case.items() if key != "expected"}


def _outputs(case: dict) -> dict:
    return {"expected": case["expected"]}


def sync_dataset(client: Any, cases: list[dict]) -> list:
    """Make the dataset hold exactly the file's situations and return their examples in file order.

    Only what differs is written, so a repeated run adds nothing. Passing these examples to `evaluate`
    (not the dataset name) is what guarantees one request per situation in the file, even if somebody
    added an example in the LangSmith UI. Examples are stored data, they do not count as traces.
    """
    if not client.has_dataset(dataset_name=DATASET_NAME):
        client.create_dataset(DATASET_NAME, description="Made-up situations for checking Jev's scores")
    existing = {example.id: example for example in client.list_examples(dataset_name=DATASET_NAME)}
    wanted = {_example_id(case): case for case in cases}

    stale = [example_id for example_id in existing if example_id not in wanted]
    if stale:
        client.delete_examples(stale)
    new = [c for i, c in wanted.items() if i not in existing]
    changed = [
        c for i, c in wanted.items()
        if i in existing and (existing[i].inputs != _inputs(c) or existing[i].outputs != _outputs(c))
    ]
    if new:
        client.create_examples(
            dataset_name=DATASET_NAME,
            examples=[{"id": _example_id(c), "inputs": _inputs(c), "outputs": _outputs(c)} for c in new],
        )
    if changed:
        client.update_examples(
            dataset_name=DATASET_NAME,
            updates=[{"id": _example_id(c), "inputs": _inputs(c), "outputs": _outputs(c)} for c in changed],
        )
    by_id = {example.id: example for example in client.list_examples(dataset_name=DATASET_NAME, example_ids=list(wanted))}
    return [by_id[_example_id(case)] for case in cases]


def winner_on_top(run: Any, example: Any) -> dict:
    """The evaluator: the same pass rule, stored as feedback on the run."""
    passed, comment = top_candidate_wins(run.outputs["scores"], example.outputs["expected"])
    return {"key": "winner_on_top", "score": 1 if passed else 0, "comment": f"{comment} {run.outputs['scores']}"}


def run_with_langsmith(client: Any, jev: JevClient, cases: list[dict], outcomes: dict[str, CheckResult]) -> str:
    """Run every situation as an experiment. Each outcome is also stored in `outcomes` as it happens,
    so the verdict never depends on LangSmith: whatever ran before a failure is kept. Returns the experiment name."""
    by_name = {case["name"]: case for case in cases}
    examples = sync_dataset(client, cases)

    def target(inputs: dict) -> dict:
        case = by_name[inputs["name"]]
        result = asyncio.run(run_situation(jev, case))
        outcomes[case["name"]] = result
        if result.status == "error":
            raise JevError(result.reason)  # LangSmith records the run as errored, not as a bad recommendation
        return {"scores": result.scores}

    experiment = evaluate(
        target,
        data=examples,
        evaluators=[winner_on_top],
        experiment_prefix=EXPERIMENT_PREFIX,
        client=client,
        max_concurrency=0,  # one at a time: friendly to the free Jev model's rate limit
        num_repetitions=1,
        disable_evaluator_tracing=True,  # otherwise every evaluator call is traced as well, doubling the usage
        error_handling="log",
    )
    return experiment.experiment_name


# --- the command ------------------------------------------------------------------------------------


def build_jev(settings: Any) -> JevClient:
    """The plain client, never `get_jev_client()`: the traced one would add a second trace per call to the
    production project, and the experiment run is the only trace this command should create."""
    return JevClient(
        api_key=settings.opencode_api_key.get_secret_value(),
        model=settings.jev_model,
        url=settings.jev_url,
        timeout=settings.jev_timeout_seconds,
    )


def build_langsmith_client(settings: Any) -> Any:
    return build_tracing_client(settings.langsmith_api_key.get_secret_value(), settings.langsmith_endpoint)


def _missing_key(settings: Any) -> str | None:
    """The first needed key that is missing or empty (the Jev key is checked first)."""
    for variable, value in (("OPENCODE_API_KEY", settings.opencode_api_key), ("LANGSMITH_API_KEY", settings.langsmith_api_key)):
        if value is None or not value.get_secret_value():
            return variable
    return None


def _run(settings: Any, cases: list[dict]) -> int:
    jev = build_jev(settings)
    outcomes: dict[str, CheckResult] = {}
    client = experiment = problem = None
    try:
        client = build_langsmith_client(settings)
        experiment = run_with_langsmith(client, jev, cases, outcomes)
    except Exception as exc:  # LangSmith must not cost us the verdict; only the class name is shown, it may quote a URL
        problem = type(exc).__name__
    # Whatever did not run inside the experiment runs now, so every situation is asked exactly once.
    for result in run_local(jev, [case for case in cases if case["name"] not in outcomes]):
        outcomes[result.situation] = result
    results = [outcomes[case["name"]] for case in cases]
    if experiment is not None:
        try:
            client.flush()
        except Exception as exc:
            problem = type(exc).__name__

    print(format_report(results))
    if experiment is not None:
        print(f"LangSmith experiment: {experiment} (dataset {DATASET_NAME})")
    if problem:
        print(f"LangSmith upload failed: {problem}")
    return exit_code(results)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check Jev's scores on made-up situations and record them in LangSmith.")
    parser.add_argument("--dry-run", action="store_true", help="validate the situations and list them, send nothing")
    args = parser.parse_args(argv)

    try:
        cases = load_cases(CASES_PATH)
    except CaseError as exc:
        print(exc, file=sys.stderr)
        return 2
    if args.dry_run:
        for case in cases:
            print(
                f"{case['name']}: liked {len(case['liked'])}, disliked {len(case['disliked'])}, "
                f"candidates {len(case['candidates'])}, expected {case['expected']}"
            )
        print("dry run, nothing sent")
        return 0

    settings = get_settings()
    missing = _missing_key(settings)
    if missing:
        print(f"missing {missing}", file=sys.stderr)
        return 2
    try:
        return _run(settings, cases)
    except Exception as exc:  # only the class name: the text of an unexpected error could quote anything
        print(f"unexpected error: {type(exc).__name__}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
