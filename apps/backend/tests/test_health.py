import httpx

from app.main import app


async def test_health_returns_ok() -> None:
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        for path in ("/health", "/api/health"):  # /api/... is what Vercel may hand over
            response = await client.get(path)
            assert response.status_code == 200
            assert response.json() == {"status": "ok"}
