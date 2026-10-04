"""Offline tests of scripts/jev_check.py: no network, no real key, never the real Jev or LangSmith."""

import json
import uuid
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

from app.config import Settings
from app.jev_client import JevClient
from app.models import Card
from app.recommender import _compact
from scripts import jev_check
from scripts.jev_check import (
    CASES_PATH,
    CheckResult,
    build_state,
    candidate_names,
    expected_id,
    format_report,
    load_cases,
    run_local,
    sync_dataset,
    top_candidate_wins,
)

CASES = load_cases(CASES_PATH)


def jev_client(handler) -> JevClient:
    return JevClient(
        api_key="test-key", model="jev-test", url="https://jev.test/systemone", timeout=2.0,
        transport=httpx.MockTransport(handler),
    )


def answers(scores: dict[str, float]) -> httpx.Response:
    return httpx.Response(200, json={"answers": {i: {"type": "noul", "noul": s} for i, s in scores.items()}})


def case_of(request: httpx.Request) -> dict:
    """The situation a Jev request belongs to, found through the name of its first candidate."""
    first = json.loads(request.content)["state"]["candidates"][0]["event_name"]
    return next(c for c in CASES if c["candidates"][0]["name"] == first)


def expected_wins(request: httpx.Request) -> httpx.Response:
    case = case_of(request)
    winner = expected_id(case)
    return answers({i: 0.9 if i == winner else 0.1 for i in candidate_names(case)})


# --- User Story 1 ---------------------------------------------------------------------------------


def test_pass_rule():
    assert top_candidate_wins({"a": 0.9, "b": 0.1}, "a")[0] is True
    passed, comment = top_candidate_wins({"a": 0.5, "b": 0.5}, "a")
    assert passed is False and "tie" in comment
    passed, comment = top_candidate_wins({"a": 0.2, "b": 0.7}, "a")
    assert passed is False and "b" in comment
    assert top_candidate_wins({"b": 0.7}, "a") == (False, "no score for the expected candidate")
    assert top_candidate_wins({"a": 0.6}, "a")[0] is True  # nothing to compare with
    assert top_candidate_wins({"a": 0.52, "b": 0.50}, "a")[0] is True  # no minimum gap


def test_state_has_the_recommender_shape_and_no_user_data():
    reference = set(_compact(Card(id=uuid.uuid4(), event_name="x", description="y", price=None, address="z")))
    for case in CASES:
        state = build_state(case)
        assert set(state) == {"liked", "disliked", "candidates"}
        cards = [card for key in state for card in state[key]]
        assert all(set(card) == reference for card in cards)
        ids = [card["id"] for card in cards]
        assert len(ids) == len(set(ids))
        assert expected_id(case) in candidate_names(case)
        assert "choices" not in json.dumps(state)


def test_one_request_per_situation_and_errors_do_not_stop_the_run():
    requests = []
    broken = CASES[2]["candidates"][0]["name"]

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if json.loads(request.content)["state"]["candidates"][0]["event_name"] == broken:
            return httpx.Response(429, json={"error": "rate limited"})
        return expected_wins(request)

    results = run_local(jev_client(handler), CASES)

    assert len(requests) == len(CASES)  # one request each, no retry
    assert [r.situation for r in results] == [c["name"] for c in CASES]
    assert results[2].status == "error" and results[2].reason == "http_429"
    assert all(r.status == "passed" for i, r in enumerate(results) if i != 2)


def test_report_lines_and_total():
    results = [
        CheckResult("metal", "passed", {"Korn": 0.91, "Spacer": 0.08}),
        CheckResult("student", "failed", {"Gala": 0.5, "Walk": 0.5}, "tie at 0.50 between Walk and Gala"),
        CheckResult("walker", "error", reason="http_429"),
    ]
    lines = format_report(results).splitlines()
    assert lines[0].split()[0] == "PASS" and "Korn 0.91" in lines[0] and "Spacer 0.08" in lines[0]
    assert lines[1].split()[0] == "FAIL" and "tie" in lines[1] and "Gala 0.50" in lines[1]
    assert lines[2].split()[0] == "ERROR" and "http_429" in lines[2]
    assert lines[-1] == "passed 1 of 2 (1 error)"
    assert format_report(results[:1]).splitlines()[-1] == "passed 1 of 1"
    assert jev_check.exit_code(results[:1]) == 0
    assert jev_check.exit_code(results) == 1
    assert jev_check.exit_code(results[:1] + results[2:]) == 1  # an error is not a pass


class FakeLangSmith:
    """Records what sync_dataset asks of LangSmith; holds the dataset's examples in memory."""

    def __init__(self, dataset_exists=True, examples=()):
        self.dataset_exists = dataset_exists
        self.examples = {e.id: e for e in examples}
        self.calls = []

    def has_dataset(self, *, dataset_name):
        return self.dataset_exists

    def create_dataset(self, dataset_name, **kwargs):
        self.calls.append(("create_dataset", dataset_name))
        self.dataset_exists = True

    def list_examples(self, dataset_name=None, example_ids=None, **kwargs):
        wanted = None if example_ids is None else set(example_ids)
        return [e for e in self.examples.values() if wanted is None or e.id in wanted]

    def create_examples(self, *, dataset_name, examples):
        self.calls.append(("create_examples", [e["id"] for e in examples]))
        for e in examples:
            self.examples[e["id"]] = SimpleNamespace(id=e["id"], inputs=e["inputs"], outputs=e["outputs"])

    def update_examples(self, *, dataset_name, updates):
        self.calls.append(("update_examples", [u["id"] for u in updates]))
        for u in updates:
            self.examples[u["id"]] = SimpleNamespace(id=u["id"], inputs=u["inputs"], outputs=u["outputs"])

    def delete_examples(self, example_ids):
        self.calls.append(("delete_examples", list(example_ids)))
        for example_id in example_ids:
            self.examples.pop(example_id)


def test_dataset_sync_is_stable_and_minimal():
    client = FakeLangSmith(dataset_exists=False)
    first = sync_dataset(client, CASES)
    assert client.calls[0] == ("create_dataset", "spotted-jev-checks")
    assert len(first) == len(CASES) == len(client.examples)
    assert [e.outputs["expected"] for e in first] == [c["expected"] for c in CASES]
    assert all("expected" not in e.inputs for e in first)

    client.calls.clear()
    again = sync_dataset(client, CASES)  # nothing changed: nothing is written
    assert client.calls == []
    assert [e.id for e in again] == [e.id for e in first]  # the same ids on every run

    changed = [dict(CASES[0], expected=CASES[0]["candidates"][1]["name"]), *CASES[1:-1]]
    client.calls.clear()
    sync_dataset(client, changed)  # one example updated, the one that left the file deleted
    assert sorted(c[0] for c in client.calls) == ["delete_examples", "update_examples"]
    assert len(client.examples) == len(changed)


def test_experiment_arguments(monkeypatch):
    client = FakeLangSmith()
    captured = {}

    def fake_evaluate(target, **kwargs):
        captured.update(kwargs)
        return SimpleNamespace(experiment_name="jev-check-abc123")

    monkeypatch.setattr(jev_check, "evaluate", fake_evaluate)
    outcomes = {}
    name = jev_check.run_with_langsmith(client, jev_client(expected_wins), CASES, outcomes)

    assert name == "jev-check-abc123"
    assert captured["num_repetitions"] == 1
    assert captured["max_concurrency"] == 0
    assert captured["disable_evaluator_tracing"] is True
    assert captured["experiment_prefix"] == "jev-check"
    assert captured["client"] is client
    assert len(captured["evaluators"]) == 1
    assert [e.inputs["name"] for e in captured["data"]] == [c["name"] for c in CASES]  # examples, not the dataset name


# --- shared helpers for the command-level tests (US2 and US3) -----------------------------------------

def settings_with(jev_key="test-key", langsmith_key="ls-test-key") -> Settings:
    # Explicit values win over the environment and .env, so a developer's own keys never leak into a test.
    return Settings(_env_file=None, opencode_api_key=jev_key, langsmith_api_key=langsmith_key)


class Sent:
    """Counts what a command would have sent and can fail the test if anything is."""

    def __init__(self):
        self.jev = []
        self.langsmith_clients = 0
        self.evaluate_calls = 0


@pytest.fixture
def sent(monkeypatch) -> Sent:
    record = Sent()

    def handler(request: httpx.Request) -> httpx.Response:
        record.jev.append(request)
        return expected_wins(request)

    def build_jev(settings):
        return jev_client(handler)

    monkeypatch.setattr(jev_check, "build_jev", build_jev)
    return record


class RecordingClient(FakeLangSmith):
    def __init__(self, sent: Sent, flush_error: Exception | None = None):
        super().__init__()
        sent.langsmith_clients += 1
        self.flush_error = flush_error

    def flush(self):
        if self.flush_error:
            raise self.flush_error


def use_langsmith(monkeypatch, sent: Sent, *, flush_error=None, client_error=None, evaluate_error=None):
    """Put a fake LangSmith client and a fake `evaluate` (which really calls the target) in place."""

    def build_client(settings):
        if client_error:
            raise client_error
        return RecordingClient(sent, flush_error)

    def fake_evaluate(target, *, data, **kwargs):
        sent.evaluate_calls += 1
        for example in data:
            try:
                target(example.inputs)
            except Exception:  # an errored situation is logged, the run goes on
                pass
        if evaluate_error:
            raise evaluate_error
        return SimpleNamespace(experiment_name="jev-check-abc123")

    monkeypatch.setattr(jev_check, "build_langsmith_client", build_client)
    monkeypatch.setattr(jev_check, "evaluate", fake_evaluate)


# --- User Story 2 ---------------------------------------------------------------------------------


@pytest.mark.parametrize("missing", ["OPENCODE_API_KEY", "LANGSMITH_API_KEY"])
@pytest.mark.parametrize("empty", [None, ""])
def test_missing_keys_stop_before_anything_is_sent(monkeypatch, capsys, sent, missing, empty):
    use_langsmith(monkeypatch, sent)
    settings = settings_with(
        jev_key=empty if missing == "OPENCODE_API_KEY" else "test-key",
        langsmith_key=empty if missing == "LANGSMITH_API_KEY" else "ls-test-key",
    )
    monkeypatch.setattr(jev_check, "get_settings", lambda: settings)

    assert jev_check.main([]) == 2

    assert f"missing {missing}" in capsys.readouterr().err
    assert sent.jev == [] and sent.langsmith_clients == 0 and sent.evaluate_calls == 0


def test_keys_never_appear_in_the_output(monkeypatch, capsys, sent):
    settings = settings_with(jev_key="MARKER-JEV-KEY", langsmith_key="MARKER-LS-KEY")
    monkeypatch.setattr(jev_check, "get_settings", lambda: settings)
    for flavor in ({}, {"client_error": RuntimeError("MARKER-JEV-KEY MARKER-LS-KEY")}):
        use_langsmith(monkeypatch, sent, **flavor)
        jev_check.main([])
    monkeypatch.setattr(jev_check, "build_jev", lambda s: jev_client(lambda r: httpx.Response(401, json={})))
    use_langsmith(monkeypatch, sent)
    jev_check.main([])

    out = capsys.readouterr()
    assert "MARKER" not in out.out + out.err
    assert "jev-check-abc123" in out.out  # the runs did print something


def test_langsmith_failure_still_prints_the_report(monkeypatch, capsys, sent):
    monkeypatch.setattr(jev_check, "get_settings", lambda: settings_with())
    use_langsmith(monkeypatch, sent, client_error=ConnectionError("down"))

    assert jev_check.main([]) == 0  # the verdict is about Jev, not about LangSmith

    lines = capsys.readouterr().out.splitlines()
    assert sum(line.startswith(" PASS") for line in lines) == len(CASES)
    assert lines[-2] == f"passed {len(CASES)} of {len(CASES)}"
    assert lines[-1] == "LangSmith upload failed: ConnectionError"
    assert len(sent.jev) == len(CASES)  # still one request per situation

    # a failure of the final flush is reported after the report too
    sent.jev.clear()
    use_langsmith(monkeypatch, sent, flush_error=TimeoutError("slow"))
    jev_check.main([])
    lines = capsys.readouterr().out.splitlines()
    assert lines[-1] == "LangSmith upload failed: TimeoutError"
    assert any(line.startswith("LangSmith experiment:") for line in lines)
    assert len(sent.jev) == len(CASES)


def test_a_failure_in_the_middle_does_not_repeat_situations(monkeypatch, capsys, sent):
    monkeypatch.setattr(jev_check, "get_settings", lambda: settings_with())
    use_langsmith(monkeypatch, sent, evaluate_error=ConnectionError("lost"))

    jev_check.main([])

    assert len(sent.jev) == len(CASES)  # what ran inside the experiment is not run again
    assert capsys.readouterr().out.splitlines()[-1] == "LangSmith upload failed: ConnectionError"


def test_check_uses_the_plain_client_and_is_never_collected(monkeypatch):
    import subprocess
    import sys
    import tomllib
    # with a LangSmith key set the client is still the plain one: no second trace in the production project
    settings = settings_with(langsmith_key="ls-test-key")
    monkeypatch.setattr("app.jev_client.get_settings", lambda: settings)  # what the app's own factory would read
    assert type(jev_check.build_jev(settings)) is JevClient

    backend = Path(jev_check.__file__).parent.parent
    pytest_options = tomllib.loads((backend / "pyproject.toml").read_text())["tool"]["pytest"]["ini_options"]
    assert pytest_options["testpaths"] == ["tests"]
    assert not Path(jev_check.__file__).name.startswith("test_")

    # importing the module needs no key and opens no connection
    code = (
        "import socket\n"
        "def refuse(*a, **k): raise SystemExit('network used at import')\n"
        "socket.socket.connect = refuse\n"
        "import scripts.jev_check\n"
    )
    done = subprocess.run([sys.executable, "-c", code], cwd=backend, capture_output=True, text=True,
                          env={"PATH": "/usr/bin:/bin", "LANGSMITH_API_KEY": "", "OPENCODE_API_KEY": ""})
    assert done.returncode == 0, done.stderr


# --- User Story 3 ---------------------------------------------------------------------------------


def write_cases(tmp_path, cases) -> Path:
    path = tmp_path / "cases.json"
    path.write_text(json.dumps(cases) if not isinstance(cases, str) else cases)
    return path


def situation(label, **changes) -> dict:
    name = label
    base = {
        "name": name,
        "liked": [{"name": "Liked", "description": "something liked"}],
        "disliked": [],
        "candidates": [
            {"name": f"{name} A", "description": "a"},
            {"name": f"{name} B", "description": "b"},
        ],
        "expected": f"{name} A",
    }
    return {**base, **changes}


def five(**changes_on_first) -> list[dict]:
    return [situation("s1", **changes_on_first), *(situation(f"s{i}") for i in range(2, 6))]


def test_the_shipped_file_is_valid():
    cases = json.loads(CASES_PATH.read_text())
    assert 5 <= len(cases) <= 10
    assert len({c["name"] for c in cases}) == len(cases)
    assert all(set(c) == {"name", "liked", "disliked", "candidates", "expected"} for c in cases)
    assert load_cases(CASES_PATH) == cases


@pytest.mark.parametrize(
    ("changes", "mentions"),
    [
        ({"candidates": [{"name": "only one", "description": "x"}], "expected": "only one"}, "s1"),
        ({"candidates": [{"name": "same", "description": "x"}, {"name": "same", "description": "y"}], "expected": "same"}, "s1"),
        ({"expected": "not a candidate"}, "s1"),
        ({"expected": None}, "s1"),
        ({"user_id": "SECRET-VALUE"}, "s1"),
        ({"liked": [{"name": "n", "description": "d", "user_id": "SECRET-VALUE"}]}, "s1"),
        ({"liked": [{"name": "n"}]}, "s1"),
        ({"name": "x" * 80}, "situation #1"),
    ],
    ids=["one-candidate", "duplicate-candidate", "expected-missing-from-candidates", "no-expected",
         "unknown-key", "unknown-card-key", "card-without-description", "name-too-long"],
)
def test_malformed_cases_are_named(tmp_path, changes, mentions):
    with pytest.raises(jev_check.CaseError) as error:
        load_cases(write_cases(tmp_path, five(**changes)))
    assert mentions in str(error.value)
    assert "SECRET-VALUE" not in str(error.value)  # a key name may be shown, its value never


def test_malformed_cases_duplicate_name_and_file_level(tmp_path):
    duplicate = [situation("same"), *[situation("same") for _ in range(4)]]
    with pytest.raises(jev_check.CaseError, match="same"):
        load_cases(write_cases(tmp_path, duplicate))
    for bad in (five()[:4], [situation(f"s{i}") for i in range(11)], "not json"):
        with pytest.raises(jev_check.CaseError, match="cases.json"):
            load_cases(write_cases(tmp_path, bad))


def test_a_new_entry_is_evaluated_like_the_others(tmp_path):
    cases = load_cases(CASES_PATH)[:-1]  # the file holds at most 10, so make room
    new = situation("a brand new situation")
    path = write_cases(tmp_path, [*cases, new])
    loaded = load_cases(path)

    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content)["state"]["candidates"][0]["event_name"])
        return answers({"c1": 0.9, "c2": 0.1})

    results = run_local(jev_client(handler), loaded)
    assert results[-1].situation == "a brand new situation" and results[-1].status == "passed"
    assert "a brand new situation A" in seen

    examples = sync_dataset(FakeLangSmith(dataset_exists=False), loaded)
    assert examples[-1].inputs["name"] == "a brand new situation"
    assert len({e.id for e in examples}) == len(loaded)


def test_dry_run_needs_no_keys_and_sends_nothing(monkeypatch, capsys, sent, tmp_path):
    use_langsmith(monkeypatch, sent)
    monkeypatch.setattr(jev_check, "get_settings", lambda: settings_with(jev_key=None, langsmith_key=None))

    assert jev_check.main(["--dry-run"]) == 0

    out = capsys.readouterr().out
    assert all(case["name"] in out for case in CASES)
    assert out.splitlines()[-1] == "dry run, nothing sent"
    assert sent.jev == [] and sent.langsmith_clients == 0 and sent.evaluate_calls == 0

    monkeypatch.setattr(jev_check, "CASES_PATH", write_cases(tmp_path, five(expected="not a candidate")))
    assert jev_check.main(["--dry-run"]) == 2
    assert "s1" in capsys.readouterr().err
