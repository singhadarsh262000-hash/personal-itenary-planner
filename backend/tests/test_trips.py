import pytest
from uuid import uuid4


@pytest.mark.asyncio
async def test_create_trip_valid(client):
    payload = {
        "title": "Kyoto Exploration",
        "destination": "Kyoto, Japan",
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "budget": 1800.0,
        "currency": "USD",
        "travelers": 2,
        "travel_style": "Comfort",
        "interests": ["Historical places", "Food", "Gardens"],
        "pace": "Balanced",
        "accommodation_preference": "Traditional Ryokan",
        "transportation_preference": "JR Pass & Walking"
    }

    res = await client.post("/api/v1/trips", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["destination"] == "Kyoto, Japan"
    assert data["duration_days"] == 5
    assert data["budget"] == 1800.0
    assert "id" in data
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_create_trip_invalid_dates(client):
    payload = {
        "destination": "Paris, France",
        "start_date": "2026-09-10",
        "end_date": "2026-09-05",  # Inverted!
        "budget": 1500.0,
        "currency": "EUR",
        "travelers": 1
    }

    res = await client.post("/api/v1/trips", json=payload)
    assert res.status_code == 422
    err = res.json()
    assert "error" in err


@pytest.mark.asyncio
async def test_create_trip_exceeds_max_duration(client):
    payload = {
        "destination": "Rome, Italy",
        "start_date": "2026-09-01",
        "end_date": "2026-09-25",  # 25 days > 14 max limit
        "budget": 3000.0,
        "currency": "EUR",
        "travelers": 2
    }

    res = await client.post("/api/v1/trips", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_trip_invalid_budget(client):
    payload = {
        "destination": "Berlin, Germany",
        "start_date": "2026-10-01",
        "end_date": "2026-10-05",
        "budget": -50.0,  # Negative budget
        "currency": "EUR",
        "travelers": 1
    }

    res = await client.post("/api/v1/trips", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_trip_crud_flow(client):
    # 1. Create
    payload = {
        "destination": "Barcelona, Spain",
        "start_date": "2026-06-10",
        "end_date": "2026-06-14",
        "budget": 1200.0,
        "currency": "EUR",
        "travelers": 2,
        "travel_style": "Cultural exploration",
        "pace": "Balanced"
    }
    create_res = await client.post("/api/v1/trips", json=payload)
    assert create_res.status_code == 201
    trip_id = create_res.json()["id"]

    # 2. List
    list_res = await client.get("/api/v1/trips")
    assert list_res.status_code == 200
    trips = list_res.json()
    assert any(t["id"] == trip_id for t in trips)

    # 3. Get single
    get_res = await client.get(f"/api/v1/trips/{trip_id}")
    assert get_res.status_code == 200
    assert get_res.json()["destination"] == "Barcelona, Spain"

    # 4. Patch update
    update_res = await client.patch(f"/api/v1/trips/{trip_id}", json={"budget": 1450.0, "travelers": 3})
    assert update_res.status_code == 200
    assert update_res.json()["budget"] == 1450.0
    assert update_res.json()["travelers"] == 3

    # 5. Delete
    del_res = await client.delete(f"/api/v1/trips/{trip_id}")
    assert del_res.status_code == 204

    # 6. Verify 404 after deletion
    get_again = await client.get(f"/api/v1/trips/{trip_id}")
    assert get_again.status_code == 404
    assert get_again.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_get_nonexistent_trip(client):
    fake_id = uuid4()
    res = await client.get(f"/api/v1/trips/{fake_id}")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"
