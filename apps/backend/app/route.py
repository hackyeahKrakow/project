from datetime import datetime, timezone

import httpx
from pydantic import BaseModel, Field

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

MAX_OPTIONS = 3
MIN_WALK_S = 60  # walking legs shorter than this are just crossing the platform


class RouteLeg(BaseModel):
    mode: str = Field(description="WALK, TRAM, BUS, RAIL… (MOTIS modes)")
    line: str | None = Field(None, description="Line number for transit legs, e.g. '4'")
    headsign: str | None = None
    from_name: str
    to_name: str
    start: datetime
    end: datetime
    minutes: int
    low_floor: bool | None = Field(
        None, description="Vehicle takes wheelchairs (low-floor tram or bus) per the ZTP timetable; null = unknown"
    )
    realtime: bool = Field(description="Times include live delays")


class RouteOption(BaseModel):
    start: datetime = Field(description="When to leave")
    end: datetime = Field(description="When you arrive")
    minutes: int
    transfers: int
    legs: list[RouteLeg]


class RoutePlan(BaseModel):
    options: list[RouteOption] = Field(description="Best public transport options, best first")
    walk_minutes: int | None = Field(None, description="Walking the whole way, if that's an option")


class RouteError(Exception):
    """Raised when the journey planner can't be reached."""


def _leg(raw: dict) -> RouteLeg:
    access = raw.get("wheelchairAccessible")
    return RouteLeg(
        mode=raw["mode"],
        line=raw.get("routeShortName") or raw.get("displayName"),
        headsign=raw.get("headsign"),
        from_name=raw["from"]["name"],
        to_name=raw["to"]["name"],
        start=raw["startTime"],
        end=raw["endTime"],
        minutes=round(raw["duration"] / 60),
        low_floor={"ACCESSIBLE": True, "NOT_ACCESSIBLE": False}.get(access),
        realtime=raw.get("realTime", False),
    )


def parse_plan(data: dict, wheelchair: bool) -> RoutePlan:
    options = [
        RouteOption(
            start=it["startTime"],
            end=it["endTime"],
            minutes=round(it["duration"] / 60),
            transfers=it["transfers"],
            legs=[_leg(leg) for leg in it["legs"] if leg["mode"] != "WALK" or leg["duration"] >= MIN_WALK_S],
        )
        for it in data.get("itineraries", [])
    ]
    if wheelchair:  # stable sort: options with a known high-floor vehicle go last, MOTIS order otherwise
        options.sort(key=lambda o: any(leg.low_floor is False for leg in o.legs))
    walks = [it["duration"] for it in data.get("direct", []) if all(leg["mode"] == "WALK" for leg in it["legs"])]
    return RoutePlan(options=options[:MAX_OPTIONS], walk_minutes=round(min(walks) / 60) if walks else None)


class Planner:
    """Public transport journeys from Transitous (MOTIS over the ZTP Kraków GTFS and live TripUpdates)."""

    def __init__(self, url: str, user_agent: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._url = url
        self._headers = {"User-Agent": user_agent}
        self._timeout = timeout
        self._transport = transport

    async def plan(
        self, origin: tuple[float, float], dest: tuple[float, float], time: datetime, arrive_by: bool, wheelchair: bool
    ) -> RoutePlan:
        # ponytail: no cache, a plan is only asked for when someone taps "Zaplanuj dojazd"; add one if traffic grows
        # (Transitous asks to be contacted before heavy use).
        params = {
            "fromPlace": f"{origin[0]},{origin[1]}",
            "toPlace": f"{dest[0]},{dest[1]}",
            "time": time.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "arriveBy": str(arrive_by).lower(),
            "timetableView": "false",  # arrive by the time and leave as late as possible (MOTIS docs)
            "pedestrianProfile": "WHEELCHAIR" if wheelchair else "FOOT",
            "directModes": "WALK",
            "language": "pl",
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                response = await client.get(self._url, params=params, headers=self._headers)
            response.raise_for_status()
            return parse_plan(response.json(), wheelchair)
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            raise RouteError(type(exc).__name__) from exc  # never log the coordinates, they are the user's location


_planner: Planner | None = None


def get_planner() -> Planner:
    global _planner
    if _planner is None:
        s = get_settings()
        _planner = Planner(s.route_url, s.geocode_user_agent, s.route_timeout_seconds)
    return _planner
