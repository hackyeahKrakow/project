import httpx
import pytest

from app import geocode as geo
from app.geocode import Geocoder, get_geocoder
from app.main import app

FEATURE = {
    "geometry": {"coordinates": [19.9497, 50.0449]},
    "properties": {"street": "Józefińska", "housenumber": "20", "district": "Podgórze", "city": "Kraków"},
}


def make(handler) -> Geocoder:
    return Geocoder("https://photon.test/api/", "spootted-test/1", 2.0, httpx.MockTransport(handler))


async def test_search_maps_features_sends_user_agent_and_caches(monkeypatch):
    monkeypatch.setattr(geo, "MIN_INTERVAL_S", 0)
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json={"features": [FEATURE, {"geometry": {}}]})

    g = make(handler)
    places = await g.search("Józefińska 20")
    again = await g.search("  józefińska   20 ")  # same query after normalizing

    assert [p.model_dump() for p in places] == [{"label": "Józefińska 20, Podgórze, Kraków", "lat": 50.0449, "lng": 19.9497}]
    assert again == places and len(calls) == 1
    assert calls[0].headers["user-agent"] == "spootted-test/1"
    assert calls[0].url.params["bbox"] == geo.KRAKOW_BBOX


@pytest.mark.parametrize("status_code", [429, 500])
async def test_endpoint_503_on_upstream_error_and_422_on_short_query(status_code):
    g = make(lambda request: httpx.Response(status_code))
    app.dependency_overrides[get_geocoder] = lambda: g
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.get("/geocode", params={"q": "Rynek Główny"})).status_code == 503
            assert (await client.get("/geocode", params={"q": "ab"})).status_code == 422
    finally:
        app.dependency_overrides.clear()
