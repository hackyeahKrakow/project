import asyncio
import csv
import io
import math
import time
import zipfile
from typing import Literal

import httpx
from google.protobuf.message import DecodeError
from google.transit import gtfs_realtime_pb2
from pydantic import BaseModel, Field

from app.config import get_settings
from app.logger import get_logger

log = get_logger(__name__)

# ZTP Kraków publishes one GTFS feed per mode: GTFS_KRK_T.zip (trams), GTFS_KRK_A.zip (buses), with matching ServiceAlerts_*.pb.
FEEDS: dict[str, Literal["tram", "bus"]] = {"T": "tram", "A": "bus"}
STOPS_TTL_S = 24 * 3600  # timetables change rarely
ALERTS_TTL_S = 120  # disruptions are live
MAX_STOP_M = 1500  # farther than this the stop is no help for getting to the event
ALERT_RADIUS_M = 400  # an alert counts if it concerns a stop this close to the event


class Stop(BaseModel):
    name: str = Field(description="Stop name, e.g. 'Plac Inwalidów'")
    mode: Literal["tram", "bus"]
    distance_m: int = Field(description="Straight-line distance from the event")


class Alert(BaseModel):
    header: str
    description: str


class TransitNear(BaseModel):
    stops: list[Stop] = Field(description="Nearest tram stop and nearest bus stop, closest first")
    alerts: list[Alert] = Field(description="Current ZTP disruptions at stops near the event")


class TransitError(Exception):
    """Raised when the ZTP stop list can't be loaded."""


# (feed, stop_id, name, lat, lng)
StopRow = tuple[str, str, str, float, float]
# (alert, stop_ids it names, feed)
AlertRow = tuple[Alert, set[str], str]


def _meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dy = (lat2 - lat1) * 111_320
    dx = (lng2 - lng1) * 111_320 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.hypot(dx, dy)


def _text(ts: gtfs_realtime_pb2.TranslatedString) -> str:
    by_lang = {t.language: t.text for t in ts.translation}
    return (by_lang.get("pl") or by_lang.get("") or next(iter(by_lang.values()), "")).strip()


def parse_stops(feed: str, zipped: bytes) -> list[StopRow]:
    with zipfile.ZipFile(io.BytesIO(zipped)) as z, z.open("stops.txt") as f:
        rows = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
        return [
            (feed, r["stop_id"], r["stop_name"].strip(), float(r["stop_lat"]), float(r["stop_lon"]))
            for r in rows
            if r.get("location_type", "0") in ("", "0")  # boarding points only, not parent stations
        ]


def parse_alerts(feed: str, pb: bytes, now: float) -> list[AlertRow]:
    msg = gtfs_realtime_pb2.FeedMessage()
    msg.ParseFromString(pb)
    out: list[AlertRow] = []
    for entity in msg.entity:
        if not entity.HasField("alert"):
            continue
        a = entity.alert
        periods = [(p.start or 0, p.end or math.inf) for p in a.active_period]
        if periods and not any(start <= now <= end for start, end in periods):
            continue
        alert = Alert(header=_text(a.header_text), description=_text(a.description_text))
        out.append((alert, {e.stop_id for e in a.informed_entity if e.stop_id}, feed))
    return out


class Transit:
    """Stops and disruptions from ZTP open data, cached for the whole process."""

    def __init__(self, base_url: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._base = base_url.rstrip("/") + "/"
        self._timeout = timeout
        self._transport = transport
        self._lock = asyncio.Lock()
        self._stops: list[StopRow] = []
        self._stops_at = -math.inf
        self._alerts: list[AlertRow] = []
        self._alerts_at = -math.inf

    async def _get(self, client: httpx.AsyncClient, name: str) -> bytes:
        response = await client.get(self._base + name)
        response.raise_for_status()
        return response.content

    async def _refresh(self) -> None:
        now = time.monotonic()
        if now - self._stops_at < STOPS_TTL_S and now - self._alerts_at < ALERTS_TTL_S:
            return
        async with self._lock:
            now = time.monotonic()
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport, follow_redirects=True) as client:
                if now - self._stops_at >= STOPS_TTL_S:
                    # ponytail: the zips (with timetables) are downloaded only for stops.txt, once a day per process;
                    # keep the stops in the database if cold starts get slow.
                    try:
                        zips = await asyncio.gather(*(self._get(client, f"GTFS_KRK_{f}.zip") for f in FEEDS))
                        self._stops = [s for f, z in zip(FEEDS, zips) for s in parse_stops(f, z)]
                        self._stops_at = now
                    except (httpx.HTTPError, zipfile.BadZipFile, KeyError, ValueError) as exc:
                        if not self._stops:
                            raise TransitError(type(exc).__name__) from exc
                        log.warning("transit_stops_stale", reason=type(exc).__name__)
                        self._stops_at = now  # yesterday's stops are still right, try again tomorrow
                if now - self._alerts_at >= ALERTS_TTL_S:
                    try:
                        pbs = await asyncio.gather(*(self._get(client, f"ServiceAlerts_{f}.pb") for f in FEEDS))
                        wall = time.time()
                        self._alerts = [a for f, pb in zip(FEEDS, pbs) for a in parse_alerts(f, pb, wall)]
                    except (httpx.HTTPError, DecodeError) as exc:
                        log.warning("transit_alerts_failed", reason=type(exc).__name__)  # stops still help without alerts
                    self._alerts_at = now  # on failure too, so a broken feed is retried every 2 minutes, not on every request

    async def near(self, lat: float, lng: float) -> TransitNear:
        await self._refresh()
        nearby = sorted(((_meters(lat, lng, s[3], s[4]), s) for s in self._stops), key=lambda x: x[0])
        stops: list[Stop] = []
        for mode in FEEDS.values():
            best = next(((d, s) for d, s in nearby if FEEDS[s[0]] == mode), None)
            if best and best[0] <= MAX_STOP_M:
                stops.append(Stop(name=best[1][2], mode=mode, distance_m=round(best[0])))
        stops.sort(key=lambda s: s.distance_m)

        close = [s for d, s in nearby if d <= ALERT_RADIUS_M]
        ids = {(s[0], s[1]) for s in close}
        names = {s[2].lower() for s in close}
        alerts: list[Alert] = []
        for alert, stop_ids, feed in self._alerts:
            text = f"{alert.header} {alert.description}".lower()
            # ponytail: alerts tied only to a route are matched by stop names in their text; joining routes to stops
            # needs stop_times.txt (millions of rows), too heavy per request.
            if any((feed, sid) in ids for sid in stop_ids) or any(n in text for n in names):
                if alert not in alerts:
                    alerts.append(alert)
        return TransitNear(stops=stops, alerts=alerts)


_transit: Transit | None = None


def get_transit() -> Transit:
    # One instance per process so every request shares the cached stops and alerts.
    global _transit
    if _transit is None:
        s = get_settings()
        _transit = Transit(s.gtfs_url, s.gtfs_timeout_seconds)
    return _transit
