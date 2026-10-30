import pytest


@pytest.mark.asyncio
async def test_health_endpoints(client):
    res1 = await client.get("/health")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "healthy"
    assert "version" in data1
    assert "ai_configured" in data1

    res2 = await client.get("/api/v1/health")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "healthy"


@pytest.mark.asyncio
async def test_cors_preflight_deployed_vercel_origin(client):
    headers = {
        "Origin": "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    # Test on versioned endpoint
    res = await client.options("/api/v1/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"
    assert "content-type" in res.headers.get("access-control-allow-headers", "").lower()

    # Test on root endpoint
    res_root = await client.options("/health", headers=headers)
    assert res_root.status_code == 200
    assert res_root.headers.get("access-control-allow-origin") == "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app"


@pytest.mark.asyncio
async def test_cors_preflight_vercel_preview_regex(client):
    headers = {
        "Origin": "https://personal-itinerary-planner-pr-123.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    res = await client.options("/api/v1/trips", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://personal-itinerary-planner-pr-123.vercel.app"


@pytest.mark.asyncio
async def test_cors_preflight_localhost(client):
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    res = await client.options("/api/v1/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


@pytest.mark.asyncio
async def test_cors_preflight_disallowed_origin(client):
    headers = {
        "Origin": "https://unauthorized-attacker-site.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    res = await client.options("/api/v1/health", headers=headers)
    assert res.status_code == 400
    assert "access-control-allow-origin" not in res.headers


@pytest.mark.asyncio
async def test_cors_actual_get_request_with_vercel_origin(client):
    headers = {
        "Origin": "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app"
    }
    res = await client.get("/api/v1/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app"
