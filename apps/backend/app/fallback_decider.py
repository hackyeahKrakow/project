"""Second opinion on the cards Jev is unsure about.

Jev answers each question with the probability of "yes". A probability near 0.5 means Jev cannot
tell, so the recommender hands exactly those cards to a chat model on DeepInfra (DeepSeek V4.1 Flash by
default), which answers yes or no for each of them. See `recommender.get_recommendations`.
"""

import json

import httpx

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

PROMPT = """You decide which events a student will be interested in.
You get the user's saved choices ("choices", optional), events the user liked ("liked") and
disliked ("disliked"), and "candidates": events to decide on. Event texts may be in Polish.
For every candidate decide whether this user will be interested in it, judging by what they
liked and disliked before.
Answer with exactly one JSON object and nothing else, in the form
{"decisions": {"<candidate id>": true or false, ...}}
with one entry for every candidate id. Copy the ids exactly."""


class FallbackError(Exception):
    """Raised for any failure of the fallback model. Messages never contain the API key or the request state."""


class FallbackDecider:
    def __init__(
        self,
        api_key: str,
        model: str,
        url: str,
        timeout: float,
        reasoning_effort: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._reasoning_effort = reasoning_effort
        self._api_key = api_key
        self._model = model
        self._url = url
        self._timeout = timeout
        self._transport = transport

    async def decide(self, state: dict, routing: dict | None = None) -> dict[str, bool]:
        """Return a yes (True) or no (False) for each candidate of `state` the model answered for.

        `routing` says why these cards were handed over (counts, the threshold). It does not change
        the call; the traced subclass in `app.monitoring` shows it next to the trace.

        The model sees short keys ("1", "2", ...) instead of the long card ids: it copies them back
        more reliably, and they cost fewer tokens.
        """
        keys = {str(n): card["id"] for n, card in enumerate(state["candidates"], start=1)}
        shown = {
            **state,
            "candidates": [{**card, "id": key} for key, card in zip(keys, state["candidates"])],
        }
        body = {
            "model": self._model,
            "temperature": 0,
            "max_tokens": 2000,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": PROMPT},
                {"role": "user", "content": json.dumps(shown, ensure_ascii=False)},
            ],
        }
        if self._reasoning_effort:  # a thinking model would spend max_tokens on reasoning, not on the answer
            body["reasoning_effort"] = self._reasoning_effort
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                response = await client.post(
                    self._url, json=body, headers={"Authorization": f"Bearer {self._api_key}"}
                )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        except httpx.TimeoutException as exc:
            raise FallbackError("timeout") from exc
        except httpx.HTTPStatusError as exc:
            raise FallbackError(f"http_{exc.response.status_code}") from exc
        except httpx.HTTPError as exc:
            raise FallbackError("network_error") from exc
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise FallbackError("invalid_response") from exc

        decisions = _valid_decisions(content, set(keys))
        return {keys[key]: yes for key, yes in decisions.items()}


def _valid_decisions(content: object, asked: set[str]) -> dict[str, bool]:
    # Models may wrap JSON in ``` fences or text: take the outermost {...}.
    if not isinstance(content, str):
        raise FallbackError("invalid_response")
    start, end = content.find("{"), content.rfind("}")
    if start < 0 or end < start:
        raise FallbackError("invalid_response")
    try:
        data = json.loads(content[start : end + 1])
    except ValueError as exc:
        raise FallbackError("invalid_response") from exc
    decisions = data.get("decisions") if isinstance(data, dict) else None
    if not isinstance(decisions, dict):
        raise FallbackError("invalid_response")
    return {k: v for k, v in decisions.items() if k in asked and isinstance(v, bool)}


def get_fallback_decider() -> FallbackDecider | None:
    """The fallback model, or None (Jev alone decides) when no DeepInfra key is configured."""
    settings = get_settings()
    key = settings.deepinfra_api_key.get_secret_value() if settings.deepinfra_api_key else None
    if not key:
        return None
    options = dict(
        api_key=key,
        model=settings.fallback_model,
        url=settings.deepinfra_url,
        timeout=settings.fallback_timeout_seconds,
        reasoning_effort=settings.fallback_reasoning_effort or None,
    )
    if settings.langsmith_api_key:  # same switch as for Jev; imported here to avoid a cycle
        try:
            from app.monitoring import TracedFallbackDecider

            return TracedFallbackDecider(**options)
        except Exception as exc:  # a broken monitoring setup must not take recommendations down
            log.warning("monitoring_disabled", error=type(exc).__name__)
    return FallbackDecider(**options)
