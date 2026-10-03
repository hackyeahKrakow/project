import httpx

from app.main import app
from app.parking import ParkingFinder, get_parking_finder

EVENT = (50.0675, 19.9918)  # TAURON Arena
OVERPASS = {
    "elements": [
        {"type": "way", "center": {"lat": 50.0690, "lon": 19.9930}, "tags": {"amenity": "parking", "name": "Parking TAURON Arena", "capacity": "1200", "capacity:disabled": "24", "fee": "yes"}},
        {"type": "node", "lat": 50.0680, "lon": 19.9900, "tags": {"amenity": "parking", "parking": "underground", "capacity:disabled": "yes"}},
        {"type": "way", "center": {"lat": 50.0740, "lon": 19.9990}, "tags": {"amenity": "parking", "park_ride": "yes", "fee": "no"}},
        {"type": "node", "lat": 50.0676, "lon": 19.9920, "tags": {"amenity": "parking_space", "parking_space": "disabled", "capacity": "2"}},
        {"type": "node", "lat": 50.0700, "lon": 19.9950, "tags": {"amenity": "parking_space", "parking_space": "disabled"}},
        {"type": "way", "tags": {"amenity": "parking"}},  # no position, skipped
    ]
}


def finder(calls: list[httpx.Request], status: int = 200) -> ParkingFinder:
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(status, json=OVERPASS)

    return ParkingFinder("https://overpass.test/api/interpreter", "spootted-test/1", 2.0, httpx.MockTransport(handler))


async def test_parkings_by_distance_disabled_spaces_and_cache():
    calls: list[httpx.Request] = []
    f = finder(calls)
    near = await f.near(*EVENT)
    again = await f.near(EVENT[0] + 0.00001, EVENT[1])  # same place, rounded

    names = [p.name for p in near.parkings]
    assert names == ["Parking podziemny", "Parking TAURON Arena", "Parking P+R"]
    underground, arena, pr = near.parkings
    assert (arena.capacity, arena.disabled_spaces, arena.has_disabled_spaces, arena.fee) == (1200, 24, True, True)
    assert (underground.disabled_spaces, underground.has_disabled_spaces) == (None, True)
    assert pr.park_ride and pr.fee is False and pr.has_disabled_spaces is None
    assert near.disabled_spaces == 3 and 10 < near.nearest_disabled_m < 40
    assert again == near and len(calls) == 1
    assert b"parking_space" in calls[0].content and calls[0].headers["user-agent"] == "spootted-test/1"


async def test_endpoint_503_when_overpass_fails():
    app.dependency_overrides[get_parking_finder] = lambda: finder([], status=504)
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.get("/parking/near", params={"lat": EVENT[0], "lng": EVENT[1]})).status_code == 503
    finally:
        app.dependency_overrides.clear()
