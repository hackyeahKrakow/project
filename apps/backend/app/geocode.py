import asyncio
import time
from collections import OrderedDict

import httpx
from pydantic import BaseModel, Field

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

# Box around Kraków (min lon, min lat, max lon, max lat). It also covers nearby towns, so results are filtered by city too.
KRAKOW_BBOX = "19.79,49.96,20.22,50.13"
CITY = "Kraków"
LIMIT = 5
CACHE_SIZE = 500
MIN_INTERVAL_S = 1.0  # fair use of the public Photon instance: at most 1 request per second from this server


class Place(BaseModel):
    label: str = Field(description="Address shown to the user, e.g. 'Józefińska 20, Podgórze, Kraków'")
    lat: float
    lng: float


class GeocodeError(Exception):
    """Raised when the geocoder can't be reached."""


class Geocoder:
    """Address suggestions from Photon (OpenStreetMap data), cached and throttled for the whole process."""

    def __init__(self, url: str, user_agent: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._url = url
        self._headers = {"User-Agent": user_agent}
        self._timeout = timeout
        self._transport = transport
        self._cache: OrderedDict[str, list[Place]] = OrderedDict()
        self._lock = asyncio.Lock()
        self._last = 0.0

    async def search(self, query: str) -> list[Place]:
        key = " ".join(query.lower().split())
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        async with self._lock:
            if key in self._cache:  # filled by a request that held the lock before us
                return self._cache[key]
            wait = self._last + MIN_INTERVAL_S - time.monotonic()
            if wait > 0:
                await asyncio.sleep(wait)
            try:
                async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                    response = await client.get(
                        self._url,
                        params={"q": query, "limit": LIMIT * 2, "bbox": KRAKOW_BBOX},  # extra room for the city filter
                        headers=self._headers,
                    )
                response.raise_for_status()
                features = response.json()["features"]
            except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
                raise GeocodeError(type(exc).__name__) from exc
            finally:
                self._last = time.monotonic()
            places = [p for p in (_place(f) for f in features) if p][:LIMIT]
            self._cache[key] = places  # written while holding the lock, so a waiting request for the same text finds it
            if len(self._cache) > CACHE_SIZE:
                self._cache.popitem(last=False)
        return places


def _place(feature: dict) -> Place | None:
    try:
        lng, lat = feature["geometry"]["coordinates"][:2]
        p = feature.get("properties", {})
    except (KeyError, TypeError, ValueError):
        return None
    if p.get("city") != CITY:  # the frontend assigns a Kraków district, so towns around it are left out
        return None
    street = " ".join(x for x in (p.get("street"), p.get("housenumber")) if x)
    parts = [p.get("name"), street if street != p.get("name") else None, p.get("district"), p.get("city")]
    label = ", ".join(dict.fromkeys(x for x in parts if x))  # keep order, drop duplicates
    return Place(label=label, lat=lat, lng=lng) if label else None


_geocoder: Geocoder | None = None


def get_geocoder() -> Geocoder:
    # One instance per process so the cache and the 1 req/s limit are shared by all requests.
    global _geocoder
    if _geocoder is None:
        s = get_settings()
        _geocoder = Geocoder(s.geocode_url, s.geocode_user_agent, s.geocode_timeout_seconds)
    return _geocoder
