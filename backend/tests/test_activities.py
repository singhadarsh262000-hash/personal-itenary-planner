import pytest
from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.schemas.activity import ActivityResponse
from app.schemas.budget import BudgetSummary
from app.schemas.common import ActivityCategory, CostBasis


@pytest.fixture
async def seeded_trip_with_itinerary(client, mock_trip_repo, mock_itinerary_repo):
    # 1. Create trip
    trip_payload = {
        "title": "Swiss Alps Escape",
        "destination": "Interlaken, Switzerland",
        "start_date": "2026-08-01",
        "end_date": "2026-08-03",
        "budget": 2000.0,
        "currency": "USD",
        "travelers": 2
    }
    trip_res = await client.post("/api/v1/trips", json=trip_payload)
    trip_data = trip_res.json()
    trip_id = UUID(trip_data["id"])

    # 2. Seed itinerary
    day1_id = uuid4()
    day2_id = uuid4()
    day3_id = uuid4()
    itinerary = ItineraryResponse(
        id=uuid4(),
        trip_id=trip_id,
        trip_title=trip_data["title"],
        destination=trip_data["destination"],
        days=[
            ItineraryDayResponse(
                id=day1_id,
                trip_id=trip_id,
                day_number=1,
                date=date(2026, 8, 1),
                theme="Arrival & Lake Brienz Cruise",
                activities=[
                    ActivityResponse(
                        id=uuid4(),
                        day_id=day1_id,
                        name="Boat Tour",
                        description="Scenic boat ride on Lake Brienz",
                        category=ActivityCategory.SIGHTSEEING,
                        start_time="14:00",
                        end_time="16:00",
                        estimated_duration_minutes=120,
                        location_name="Lake Brienz Dock",
                        estimated_cost=Decimal("35.00"),
                        currency="USD",
                        cost_basis=CostBasis.PER_PERSON,
                        sort_order=1
                    )
                ]
            ),
            ItineraryDayResponse(
                id=day2_id,
                trip_id=trip_id,
                day_number=2,
                date=date(2026, 8, 2),
                theme="Jungfraujoch Excursion",
                activities=[]
            ),
            ItineraryDayResponse(
                id=day3_id,
                trip_id=trip_id,
                day_number=3,
                date=date(2026, 8, 3),
                theme="Departure",
                activities=[]
            )
        ],
        budget_estimate=BudgetSummary(
            planned_budget=Decimal("2000.00"),
            total_estimated_cost=Decimal("70.00"),
            currency="USD",
            remaining_budget=Decimal("1930.00"),
            traveler_count=2,
            trip_days=3
        ),
        general_travel_tips=["Get the Swiss Travel Pass"]
    )
    await mock_itinerary_repo.save_itinerary(itinerary)
    await mock_trip_repo.update_status(trip_id, "generated", has_itinerary=True)

    return {
        "trip_id": trip_id,
        "itinerary_id": str(itinerary.id),
        "day1_id": str(day1_id),
        "day2_id": str(day2_id),
        "initial_activity_id": str(itinerary.days[0].activities[0].id)
    }


@pytest.mark.asyncio
async def test_add_activity_flow(client, seeded_trip_with_itinerary):
    day1_id = seeded_trip_with_itinerary["day1_id"]
    trip_id = seeded_trip_with_itinerary["trip_id"]

    act_payload = {
        "name": "Fondue Dinner",
        "description": "Traditional Swiss cheese fondue",
        "category": "Dining",
        "start_time": "18:30",
        "end_time": "20:00",
        "estimated_duration_minutes": 90,
        "location_name": "Restaurant Taverne",
        "estimated_cost": 45.0,
        "currency": "USD",
        "cost_basis": "per_person"
    }

    res = await client.post(f"/api/v1/itinerary-days/{day1_id}/activities", json=act_payload)
    assert res.status_code == 201
    act_data = res.json()
    assert act_data["name"] == "Fondue Dinner"
    assert act_data["category"] == "Dining"

    # Check that trip itinerary budget was updated:
    # 35 * 2 (Boat Tour) + 45 * 2 (Fondue) = 70 + 90 = 160.00
    itin_res = await client.get(f"/api/v1/trips/{trip_id}/itinerary")
    assert itin_res.status_code == 200
    budget = itin_res.json()["budget_estimate"]
    assert budget["total_estimated_cost"] == 160.0
    assert budget["categories"]["Food"]["estimated_cost"] == 90.0


@pytest.mark.asyncio
async def test_update_activity_flow(client, seeded_trip_with_itinerary):
    act_id = seeded_trip_with_itinerary["initial_activity_id"]
    trip_id = seeded_trip_with_itinerary["trip_id"]

    update_payload = {
        "name": "Deluxe VIP Boat Tour",
        "estimated_cost": 60.0  # changed from 35 to 60 -> 60 * 2 = 120
    }

    res = await client.patch(f"/api/v1/activities/{act_id}", json=update_payload)
    assert res.status_code == 200
    assert res.json()["name"] == "Deluxe VIP Boat Tour"
    assert res.json()["estimated_cost"] == 60.0

    # Verify budget updated
    itin_res = await client.get(f"/api/v1/trips/{trip_id}/itinerary")
    assert itin_res.json()["budget_estimate"]["total_estimated_cost"] == 120.0


@pytest.mark.asyncio
async def test_delete_activity_flow(client, seeded_trip_with_itinerary):
    act_id = seeded_trip_with_itinerary["initial_activity_id"]
    trip_id = seeded_trip_with_itinerary["trip_id"]

    del_res = await client.delete(f"/api/v1/activities/{act_id}")
    assert del_res.status_code == 204

    # Verify 0 cost now
    itin_res = await client.get(f"/api/v1/trips/{trip_id}/itinerary")
    assert itin_res.json()["budget_estimate"]["total_estimated_cost"] == 0.0


@pytest.mark.asyncio
async def test_reorder_activities(client, seeded_trip_with_itinerary):
    day1_id = seeded_trip_with_itinerary["day1_id"]
    initial_act_id = seeded_trip_with_itinerary["initial_activity_id"]

    # Add second activity
    res2 = await client.post(f"/api/v1/itinerary-days/{day1_id}/activities", json={
        "name": "Evening Stroll",
        "description": "Walk along the canal",
        "category": "Sightseeing",
        "start_time": "20:00",
        "end_time": "21:00",
        "estimated_duration_minutes": 60,
        "location_name": "Aare River Path",
        "estimated_cost": 0.0,
        "cost_basis": "per_group"
    })
    act2_id = res2.json()["id"]

    # Reorder to put Evening Stroll first
    reorder_res = await client.post(
        f"/api/v1/itinerary-days/{day1_id}/activities/reorder",
        json={"activity_ids": [act2_id, initial_act_id]}
    )
    assert reorder_res.status_code == 200
    ordered = reorder_res.json()
    assert ordered[0]["id"] == act2_id
    assert ordered[0]["sort_order"] == 1
    assert ordered[1]["id"] == initial_act_id
    assert ordered[1]["sort_order"] == 2
