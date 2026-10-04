"""LangSmith traces of the Jev calls.

`TracedJevClient` runs the normal `JevClient.score_interest` inside a trace and changes nothing
else: the result, the exceptions and the timeouts stay exactly those of the parent class. It is
only used when a LangSmith key is configured (see `get_jev_client`), so without a key none of this
code is on the request path.
"""

import re
from functools import lru_cache
from typing import Any

from langsmith import Client, traceable, tracing_context
from langsmith.run_helpers import get_current_run_tree

from app.config import get_settings
from app.jev_client import JevClient, JevError
from app.logger import get_logger

log = get_logger(__name__)


def scrub_error_text(value: Any) -> Any:
    """Client-side filter for what a trace stores as a run's error (the SDK passes `{"error": text}`).

    The text of a `JevError` is one of our safe reason codes and stays. The text of any other error
    could quote what the call was handling, for example the user's saved choices, so only its class
    name is kept. Every other value, the inputs, outputs and metadata, passes through unchanged.
    """
    if isinstance(value, dict) and set(value) == {"error"} and isinstance(value["error"], str):
        text = value["error"]
        if text.startswith("JevError("):
            return value
        name = re.match(r"\s*([A-Za-z_][\w.]*)", text)
        return {"error": name.group(1) if name else "error"}
    return value


@lru_cache
def get_tracing_client() -> Client:
    """One LangSmith client for the whole process. Short timeouts: uploads run in the background."""
    settings = get_settings()
    options = {}
    if settings.langsmith_endpoint:  # empty means the SDK default (US)
        options["api_url"] = settings.langsmith_endpoint
    # The key is passed explicitly: the SDK reads only the real environment, not our .env file.
    return Client(
        api_key=settings.langsmith_api_key.get_secret_value(),
        timeout_ms=(2_000, 5_000),
        anonymizer=scrub_error_text,
        **options,
    )


def _redact_inputs(inputs: dict) -> dict:
    """What a trace may show of a Jev request: the cards, never the user's saved choices.

    The candidate cards are shown as they were sent to Jev, the liked and disliked cards only by id
    and name, and the choices only as a yes or no. Any failure here gives a fixed placeholder and
    never the raw inputs, so a bug cannot leak what this function exists to hide.
    """
    try:
        state = inputs["state"]
        brief = lambda cards: [{"id": c["id"], "event_name": c["event_name"]} for c in cards]  # noqa: E731
        return {
            "model": inputs["model"],
            "questions": len(inputs["question_ids"]),
            "candidates": state["candidates"],
            "liked": brief(state["liked"]),
            "disliked": brief(state["disliked"]),
            "choices_included": "choices" in state,
        }
    except Exception:
        return {"redaction": "failed"}


def _state_counts(state: Any) -> dict[str, Any]:
    """The counts shown as trace metadata. An odd state gives fewer entries, never an error."""
    counts: dict[str, Any] = {}
    for key in ("candidates", "liked", "disliked"):
        try:
            counts[key] = len(state[key])
        except Exception:
            pass
    try:
        counts["has_choices"] = "choices" in state
    except Exception:
        pass
    return counts


def _annotate(run: Any, **metadata: Any) -> None:
    """Add metadata to the current run. Tracing is off when `run` is None, and nothing here may raise."""
    if run is None:
        return
    try:
        run.add_metadata(metadata)
    except Exception as exc:  # monitoring must never break the call it watches
        log.debug("trace_metadata_failed", error=type(exc).__name__)


class TracedJevClient(JevClient):
    def __init__(
        self, *args, tracing_client: Client | None = None, environment: str | None = None, **kwargs
    ) -> None:
        super().__init__(*args, **kwargs)
        self._tracing_client = tracing_client or get_tracing_client()
        self._environment = environment or get_settings().environment  # tells production from dev

    async def score_interest(self, state: dict, question_ids: list[str]) -> dict[str, float]:
        settings = get_settings()
        parent = super().score_interest  # `super()` does not work inside the nested function

        @traceable(
            name="jev.score_interest",
            run_type="chain",
            client=self._tracing_client,
            project_name=settings.langsmith_project,
            tags=[self._environment],
            process_inputs=_redact_inputs,
            process_outputs=lambda scores: {"scores": scores},
        )
        async def traced(model: str, state: dict, question_ids: list[str]) -> dict[str, float]:
            run = get_current_run_tree()
            _annotate(run, model=model, **_state_counts(state))
            try:
                scores = await parent(state, question_ids)
            except Exception as exc:
                # JevError messages are safe reason codes; any other error gets a fixed text
                _annotate(run, outcome="failed", reason=str(exc) if isinstance(exc, JevError) else "unexpected_error")
                raise
            _annotate(run, outcome="success")
            return scores

        with tracing_context(enabled=True, client=self._tracing_client):
            return await traced(self._model, state, question_ids)
