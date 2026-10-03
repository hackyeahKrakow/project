import httpx

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

# Jev only sees the instruction text, not the question key, so each question must name its id.
INSTRUCTIONS = (
    "Given the events this user liked and disliked, will this user be interested in the "
    "candidate event with id"
)


class JevError(Exception):
    """Raised for any Jev failure. Messages never contain the API key or the request state."""


class JevClient:
    def __init__(
        self,
        api_key: str | None,
        model: str,
        url: str,
        timeout: float,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._url = url
        self._timeout = timeout
        self._transport = transport

    async def score_interest(self, state: dict, question_ids: list[str]) -> dict[str, float]:
        """Ask Jev one yes/no question per id and return the probability of yes for each."""
        if not self._api_key:
            raise JevError("missing_api_key")

        body = {
            "model": self._model,
            "state": state,
            "questions": {
                question_id: {"type": "noul", "instructions": f"{INSTRUCTIONS} {question_id}?"}
                for question_id in question_ids
            },
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                response = await client.post(
                    self._url, json=body, headers={"Authorization": f"Bearer {self._api_key}"}
                )
            response.raise_for_status()
            answers = response.json()["answers"]
        except httpx.TimeoutException as exc:
            raise JevError("timeout") from exc
        except httpx.HTTPStatusError as exc:
            raise JevError(f"http_{exc.response.status_code}") from exc
        except httpx.HTTPError as exc:
            raise JevError("network_error") from exc
        except (ValueError, KeyError, TypeError) as exc:
            raise JevError("invalid_response") from exc

        return _valid_probabilities(answers, set(question_ids))


def _valid_probabilities(answers: object, asked: set[str]) -> dict[str, float]:
    if not isinstance(answers, dict):
        raise JevError("invalid_response")
    scores: dict[str, float] = {}
    for question_id, answer in answers.items():
        value = answer.get("noul") if isinstance(answer, dict) else None
        is_number = isinstance(value, (int, float)) and not isinstance(value, bool)
        if question_id in asked and is_number and 0 <= value <= 1:
            scores[question_id] = float(value)
    return scores


def get_jev_client() -> JevClient:
    settings = get_settings()
    key = settings.opencode_api_key.get_secret_value() if settings.opencode_api_key else None
    return JevClient(
        api_key=key or None,
        model=settings.jev_model,
        url=settings.jev_url,
        timeout=settings.jev_timeout_seconds,
    )
