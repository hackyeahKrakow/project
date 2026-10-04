import json
from datetime import date, datetime
from typing import Literal
from zoneinfo import ZoneInfo

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

WARSAW = ZoneInfo("Europe/Warsaw")
Category = Literal["nauka", "sport", "muzyka", "gry", "imprezy", "kultura", "warsztaty"]
Size = Literal["small", "medium", "large"]
FIELDS = ("title", "description", "category", "starts_at", "ends_at", "address", "price", "size")
WEEKDAYS = ("poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela")

PROMPT = """Wyciągasz dane wydarzenia studenckiego z polskiego posta. Dziś jest {weekday}, {today}, strefa Europe/Warsaw.
Odpowiedz wyłącznie jednym obiektem JSON, bez komentarzy, z polami:
"title" (krótki tytuł), "description" (1-3 zdania), "category" (jedno z: nauka, sport, muzyka, gry, imprezy, kultura, warsztaty),
"starts_at" i "ends_at" (ISO 8601 z przesunięciem strefy, np. 2026-10-08T19:00:00+02:00; "w czwartek" = najbliższy czwartek od dziś),
"address" (ulica i numer, miasto Kraków, jeśli nie podano innego), "price" (liczba w zł, 0 = za darmo),
"size" ("small" do 30 osób, "medium" 30-100, "large" powyżej 100),
"uncertain_fields" (lista nazw pól, które zgadujesz).
Jeśli czegoś nie ma w tekście, wpisz null. Nie wymyślaj danych."""


class EventDraft(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category: Category | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    address: str | None = Field(default=None, max_length=300)
    price: float | None = Field(default=None, ge=0)
    size: Size | None = None
    missing_fields: list[str] = Field(
        default_factory=list, description="Fields that are empty or that the AI was unsure about"
    )


class ParseRequest(BaseModel):
    text: str = Field(min_length=10, max_length=4000, description="Text of the organizer's post")


class ParserError(Exception):
    """Raised when the AI can't be reached. Messages never contain the API key or the post."""


class EventParser:
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

    async def parse(self, text: str, today: date) -> EventDraft:
        """Ask the model for a draft; one retry on invalid JSON, then an empty draft."""
        if not self._api_key:
            raise ParserError("missing_api_key")
        body = {
            "model": self._model,
            "temperature": 0,
            "max_tokens": 2000,
            "messages": [
                {"role": "system", "content": PROMPT.format(weekday=WEEKDAYS[today.weekday()], today=today)},
                {"role": "user", "content": text},
            ],
        }
        for attempt in (1, 2):
            content = await self._complete(body)
            try:
                return _draft(content)
            except ValueError:
                log.warning("parse_invalid_json", attempt=attempt)
        return EventDraft(missing_fields=list(FIELDS))

    async def _complete(self, body: dict) -> str:
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                response = await client.post(
                    self._url, json=body, headers={"Authorization": f"Bearer {self._api_key}"}
                )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except httpx.TimeoutException as exc:
            raise ParserError("timeout") from exc
        except httpx.HTTPStatusError as exc:
            raise ParserError(f"http_{exc.response.status_code}") from exc
        except httpx.HTTPError as exc:
            raise ParserError("network_error") from exc
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ParserError("invalid_response") from exc


def _draft(content: str) -> EventDraft:
    # Models may wrap JSON in ``` fences or reasoning text: take the outermost {...}.
    start, end = content.find("{"), content.rfind("}")
    if start < 0 or end < start:
        raise ValueError("no_json")
    data = json.loads(content[start : end + 1])
    if not isinstance(data, dict):
        raise ValueError("not_object")
    uncertain = data.pop("uncertain_fields", None) or []
    # One bad field (e.g. an unknown category) becomes empty instead of failing the whole draft.
    valid = {}
    for k in FIELDS:
        try:
            EventDraft.model_validate({k: data.get(k)})
            valid[k] = data.get(k)
        except ValidationError:
            pass
    draft = EventDraft.model_validate(valid)
    for field in ("starts_at", "ends_at"):
        value = getattr(draft, field)
        if value is not None and value.tzinfo is None:
            setattr(draft, field, value.replace(tzinfo=WARSAW))
    draft.missing_fields = [
        f for f in FIELDS if getattr(draft, f) is None or (isinstance(uncertain, list) and f in uncertain)
    ]
    return draft


def get_event_parser() -> EventParser:
    settings = get_settings()
    key = settings.opencode_api_key.get_secret_value() if settings.opencode_api_key else None
    return EventParser(
        api_key=key or None,
        model=settings.parse_model,
        url=settings.parse_url,
        timeout=settings.parse_timeout_seconds,
    )


def warsaw_today() -> date:
    return datetime.now(WARSAW).date()
