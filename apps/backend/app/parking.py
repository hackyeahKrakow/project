import asyncio
import time
from collections import OrderedDict

import httpx
from pydantic import BaseModel, Field

from app.config import get_settings
from app.logger import get_logger
from app.transit import meters

log = get_logger(__name__)

PARKING_RADIUS_M = 800
DISABLED_RADIUS_M = 400
MAX_PARKINGS = 4
TTL_S = 24 * 3600  # parkings don't move; events sit at a handful of venues
CACHE_SIZE = 200
KINDS = {"multi-storey": "Parking wielopoziomowy", "underground": "Parking podziemny"}

QUERY = """[out:json][timeout:20];
(
  nwr(around:{pr},{lat},{lng})["amenity"="parking"]["access"!~"^(private|no|customers|permit|delivery)$"];
  nwr(around:{dr},{lat},{lng})["amenity"="parking_space"]["parking_space"="disabled"];
);
out center tags;"""


class Parking(BaseModel):
    name: str
    distance_m: int
    lat: float
    lng: float
    capacity: int | None = Field(None, description="Number of spaces, if mapped")
    disabled_spaces: int | None = Field(None, description="Number of spaces for people with disabilities, if mapped")
    has_disabled_spaces: bool | None = Field(None, description="capacity:disabled is yes or a number > 0; null = not mapped")
    fee: bool | None = Field(None, description="Paid parking; null = unknown")
    park_ride: bool = Field(description="Park & Ride")


class ParkingNear(BaseModel):
    parkings: list[Parking] = Field(description="Public car parks within 800 m, closest first")
    disabled_spaces: int = Field(description="Mapped on-street spaces for people with disabilities within 400 m")
    nearest_disabled_m: int | None = None


class ParkingError(Exception):
    """Raised when Overpass can't be reached."""


def _int(value: str | None) -> int | None:
    return int(value) if value and value.isdigit() else None


def parse_parking(data: dict, lat: float, lng: float) -> ParkingNear:
    parkings: list[Parking] = []
    spaces: list[tuple[float, int]] = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        point = el if "lat" in el else el.get("center")
        if not point:
            continue
        d = meters(lat, lng, point["lat"], point["lon"])
        if tags.get("amenity") == "parking_space":
            spaces.append((d, _int(tags.get("capacity")) or 1))
            continue
        park_ride = tags.get("park_ride", "no") != "no"
        disabled = tags.get("capacity:disabled")
        parkings.append(
            Parking(
                name=tags.get("name") or ("Parking P+R" if park_ride else KINDS.get(tags.get("parking", ""), "Parking")),
                distance_m=round(d),
                lat=point["lat"],
                lng=point["lon"],
                capacity=_int(tags.get("capacity")),
                disabled_spaces=_int(disabled),
                has_disabled_spaces=None if disabled is None else disabled not in ("no", "0"),
                fee={"yes": True, "no": False}.get(tags.get("fee", "")),
                park_ride=park_ride,
            )
        )
    parkings.sort(key=lambda p: p.distance_m)
    return ParkingNear(
        parkings=parkings[:MAX_PARKINGS],
        disabled_spaces=sum(n for _, n in spaces),
        nearest_disabled_m=round(min(d for d, _ in spaces)) if spaces else None,
    )


class ParkingFinder:
    """Car parks and spaces for people with disabilities around an event, from OpenStreetMap via Overpass."""

    def __init__(self, url: str, user_agent: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._url = url
        self._headers = {"User-Agent": user_agent}
        self._timeout = timeout
        self._transport = transport
        self._cache: OrderedDict[tuple[float, float], tuple[float, ParkingNear]] = OrderedDict()
        self._lock = asyncio.Lock()  # one Overpass query at a time from this process (fair use)

    async def near(self, lat: float, lng: float) -> ParkingNear:
        key = (round(lat, 4), round(lng, 4))  # ~10 m
        hit = self._cache.get(key)
        if hit and time.monotonic() - hit[0] < TTL_S:
            return hit[1]
        async with self._lock:
            hit = self._cache.get(key)
            if hit and time.monotonic() - hit[0] < TTL_S:
                return hit[1]
            query = QUERY.format(pr=PARKING_RADIUS_M, dr=DISABLED_RADIUS_M, lat=lat, lng=lng)
            try:
                async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                    response = await client.post(self._url, data={"data": query}, headers=self._headers)
                response.raise_for_status()
                result = parse_parking(response.json(), lat, lng)
            except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
                raise ParkingError(type(exc).__name__) from exc
            self._cache[key] = (time.monotonic(), result)
            if len(self._cache) > CACHE_SIZE:
                self._cache.popitem(last=False)
        return result


_finder: ParkingFinder | None = None


def get_parking_finder() -> ParkingFinder:
    global _finder
    if _finder is None:
        s = get_settings()
        _finder = ParkingFinder(s.overpass_url, s.geocode_user_agent, s.overpass_timeout_seconds)
    return _finder
