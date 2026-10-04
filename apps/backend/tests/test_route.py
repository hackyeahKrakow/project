import httpx

from app.main import app
from app.route import Planner, get_planner

FROM = {"from_lat": 50.0699, "from_lng": 19.9058}  # akademik, Budryka
TO = {"to_lat": 50.0675, "to_lng": 19.9918}  # TAURON Arena


def leg(mode, start, end, secs, frm="A", to="B", **extra):
    return {"mode": mode, "startTime": start, "endTime": end, "duration": secs, "from": {"name": frm}, "to": {"name": to}, **extra}


def itinerary(start, end, legs, transfers=0):
    return {"startTime": start, "endTime": end, "duration": sum(x["duration"] for x in legs), "transfers": transfers, "legs": legs}


PLAN = {
    "itineraries": [
        itinerary(
            "2026-10-16T16:20:00Z",
            "2026-10-16T16:50:00Z",
            [
                leg("WALK", "2026-10-16T16:20:00Z", "2026-10-16T16:25:00Z", 300, "Start", "Plac Inwalidów"),
                leg("TRAM", "2026-10-16T16:25:00Z", "2026-10-16T16:45:00Z", 1200, "Plac Inwalidów", "TAURON Arena",
                    routeShortName="4", headsign="Wzgórza Krzesławickie", wheelchairAccessible="NOT_ACCESSIBLE", realTime=True),
                leg("WALK", "2026-10-16T16:45:00Z", "2026-10-16T16:45:30Z", 30),  # platform hop, dropped
                leg("WALK", "2026-10-16T16:45:30Z", "2026-10-16T16:50:00Z", 270, "TAURON Arena", "Koniec"),
            ],
        ),
        itinerary(
            "2026-10-16T16:10:00Z",
            "2026-10-16T16:48:00Z",
            [leg("BUS", "2026-10-16T16:10:00Z", "2026-10-16T16:48:00Z", 2280, "AGH", "Wieczysta", routeShortName="501", wheelchairAccessible="ACCESSIBLE")],
        ),
    ],
    "direct": [{"duration": 6000, "legs": [leg("WALK", "x", "y", 6000)]}],
}


def planner(seen: list[httpx.Request], status: int = 200) -> Planner:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(status, json=PLAN if status == 200 else {"error": "x"})

    return Planner("https://motis.test/api/v5/plan", "spootted-test/1", 2.0, httpx.MockTransport(handler))


async def get(p: Planner, **params) -> httpx.Response:
    app.dependency_overrides[get_planner] = lambda: p
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            return await client.get("/route", params={**FROM, **TO, "time": "2026-10-16T19:00:00+02:00", **params})
    finally:
        app.dependency_overrides.clear()


async def test_arrive_by_plan_with_low_floor_and_walk_alternative():
    seen: list[httpx.Request] = []
    res = await get(planner(seen))
    body = res.json()

    q = seen[0].url.params
    assert (q["time"], q["arriveBy"], q["timetableView"], q["pedestrianProfile"]) == ("2026-10-16T17:00:00Z", "true", "false", "FOOT")
    assert seen[0].headers["user-agent"] == "spootted-test/1"
    first = body["options"][0]
    assert [(x["mode"], x["line"], x["low_floor"]) for x in first["legs"]] == [("WALK", None, None), ("TRAM", "4", False), ("WALK", None, None)]
    assert first["minutes"] == 30 and first["legs"][1]["realtime"] is True
    assert body["walk_minutes"] == 100


async def test_wheelchair_puts_high_floor_last_and_asks_for_step_free_walking():
    seen: list[httpx.Request] = []
    body = (await get(planner(seen), wheelchair="true")).json()
    assert seen[0].url.params["pedestrianProfile"] == "WHEELCHAIR"
    assert [o["legs"][0]["line"] for o in body["options"]] == ["501", None]


async def test_503_when_planner_fails_and_422_outside_krakow():
    assert (await get(planner([], status=500))).status_code == 503
    assert (await get(planner([]), from_lat=52.23)).status_code == 422
