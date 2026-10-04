import io
import time
import zipfile

import httpx
from google.transit import gtfs_realtime_pb2

from app.main import app
from app.transit import Transit, get_transit

EVENT = (50.0647, 19.9232)  # al. Mickiewicza 30


def gtfs_zip(rows: list[str]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("stops.txt", "﻿stop_id,stop_name,stop_lat,stop_lon,location_type\n" + "\n".join(rows))
    return buf.getvalue()


def alerts_pb(*alerts: tuple[str, list[str], int | None]) -> bytes:
    msg = gtfs_realtime_pb2.FeedMessage()
    msg.header.gtfs_realtime_version = "2.0"
    for i, (header, stop_ids, end) in enumerate(alerts):
        a = msg.entity.add(id=str(i)).alert
        a.header_text.translation.add(text=header, language="pl")
        a.description_text.translation.add(text=f"Opis: {header}")
        for sid in stop_ids:
            a.informed_entity.add(stop_id=sid)
        if end is not None:
            a.active_period.add(start=1, end=end)
    return msg.SerializeToString()


FILES = {
    "GTFS_KRK_T.zip": gtfs_zip(
        [
            "t1,Plac Inwalidów,50.0662,19.9255,0",  # ~230 m
            "t2,Rondo Mogilskie,50.0654,19.9590,0",  # ~2.5 km
            "t9,Plac Inwalidów (stacja),50.0662,19.9255,1",  # parent station, skipped
        ]
    ),
    "GTFS_KRK_A.zip": gtfs_zip(["a1,AGH / UR,50.0655,19.9215,0", "a2,Czarnowiejska,50.0670,19.9190,0"]),
    "ServiceAlerts_T.pb": alerts_pb(
        ("Przystanek nieczynny", ["t1"], None),
        ("Objazd w Nowej Hucie", ["t2"], None),
        ("Tramwaje omijają Plac Inwalidów", [], None),  # route-level, matched by stop name
        ("Stara awaria", ["t1"], int(time.time()) - 60),  # already over
    ),
    "ServiceAlerts_A.pb": alerts_pb(("Inny feed, to samo id", ["t1"], None)),  # ids are per feed
}


def ztp(fail: set[str] = frozenset(), calls: list[str] | None = None) -> Transit:
    def handler(request: httpx.Request) -> httpx.Response:
        name = request.url.path.rsplit("/", 1)[-1]
        if calls is not None:
            calls.append(name)
        return httpx.Response(500) if name in fail else httpx.Response(200, content=FILES[name])

    return Transit("https://gtfs.test", 2.0, httpx.MockTransport(handler))


async def test_nearest_stop_per_mode_and_alerts_near_the_event():
    calls: list[str] = []
    t = ztp(calls=calls)
    near = await t.near(*EVENT)
    again = await t.near(*EVENT)

    assert [(s.name, s.mode) for s in near.stops] == [("AGH / UR", "bus"), ("Plac Inwalidów", "tram")]
    assert 150 < near.stops[1].distance_m < 300
    assert [a.header for a in near.alerts] == ["Przystanek nieczynny", "Tramwaje omijają Plac Inwalidów"]
    assert again == near and len(calls) == 4  # two zips and two alert feeds, fetched once


async def test_alerts_down_still_gives_stops_and_far_away_gives_nothing():
    t = ztp(fail={"ServiceAlerts_T.pb", "ServiceAlerts_A.pb"})
    near = await t.near(*EVENT)
    assert len(near.stops) == 2 and near.alerts == []
    assert (await t.near(50.0, 20.25)).stops == []  # no stop within 1.5 km


async def test_endpoint_503_without_stops_and_422_outside_krakow():
    app.dependency_overrides[get_transit] = lambda: ztp(fail={"GTFS_KRK_T.zip"})
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.get("/transit/near", params={"lat": EVENT[0], "lng": EVENT[1]})).status_code == 503
            assert (await client.get("/transit/near", params={"lat": 52.23, "lng": 21.01})).status_code == 422
    finally:
        app.dependency_overrides.clear()
