from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4
import httpx
import pytest

from app.api.deps import get_groq_service, get_gemini_service
from app.main import app
from app.ai.groq_service import GroqService
from app.core.exceptions import AIConfigurationException, AIProviderException
from app.schemas.itinerary import (
    AIAssistedItinerary,
    AIAssistedDay,
    AIAssistedActivity,
    ItineraryResponse,
)
from app.schemas.common import ActivityCategory, CostBasis
from groq import AuthenticationError, NotFoundError, RateLimitError


@pytest.fixture
def mock_groq_response_payload():
    return AIAssistedItinerary(
        days=[
            AIAssistedDay(
                day_number=1,
                date="2026-07-01",
                theme="Historic Asakusa & Sumida River",
                notes="Wear comfortable walking shoes.",
                accommodation_suggestion="Shinjuku Hotel",
                dining_suggestions=["Asakusa Soba House", "Golden Gai Yakitori"],
                transportation_suggestions=["Tokyo Subway 72hr Ticket"],
                activities=[
                    AIAssistedActivity(
                        name="Senso-ji Temple Tour",
                        description="Explore Tokyo's oldest Buddhist temple and Nakamise-dori",
                        category=ActivityCategory.SIGHTSEEING,
                        start_time="09:30",
                        end_time="11:30",
                        estimated_duration_minutes=120,
                        location_name="Senso-ji, Asakusa",
                        estimated_cost=Decimal("0.00"),
                        cost_basis=CostBasis.TOTAL
                    ),
                    AIAssistedActivity(
                        name="Sushi Lunch Tasting",
                        description="Traditional Edo-mae sushi set",
                        category=ActivityCategory.DINING,
                        start_time="12:00",
                        end_time="13:30",
                        estimated_duration_minutes=90,
                        location_name="Sushi Zanmai Asakusa",
                        estimated_cost=Decimal("30.00"),
                        cost_basis=CostBasis.PER_PERSON
                    )
                ]
            ),
            AIAssistedDay(
                day_number=2,
                date="2026-07-02",
                theme="Modern Shibuya & Meiji Shrine",
                notes="Great for photography.",
                accommodation_suggestion="Shinjuku Hotel",
                dining_suggestions=["Ichiran Ramen"],
                transportation_suggestions=["Yamanote Line"],
                activities=[
                    AIAssistedActivity(
                        name="Meiji Jingu Shrine Stroll",
                        description="Walk through tranquil forested shrine grounds",
                        category=ActivityCategory.CULTURE,
                        start_time="10:00",
                        end_time="12:00",
                        estimated_duration_minutes=120,
                        location_name="Harajuku / Shibuya",
                        estimated_cost=Decimal("0.00"),
                        cost_basis=CostBasis.PER_PERSON
                    )
                ]
            )
        ],
        general_travel_tips=[
            "Purchase an IC card (Suica or Pasmo) for smooth transit.",
            "Always carry a small hand towel as many public restrooms do not have paper towels."
        ]
    )


# Alias fixture for backwards compatibility
mock_gemini_response_payload = mock_groq_response_payload


@pytest.mark.asyncio
async def test_generate_itinerary_missing_groq_key(client):
    trip_payload = {
        "title": "Tokyo Trip",
        "destination": "Tokyo, Japan",
        "start_date": "2026-07-01",
        "end_date": "2026-07-02",
        "budget": 2000.0,
        "currency": "USD",
        "travelers": 2
    }
    create_res = await client.post("/api/v1/trips", json=trip_payload)
    trip_id = create_res.json()["id"]

    # When key is empty or placeholder, service raises AIConfigurationException (503)
    with patch("app.core.config.settings.GROQ_API_KEY", ""):
        unconfigured_service = GroqService(api_key="")
        app.dependency_overrides[get_groq_service] = lambda: unconfigured_service

        gen_res = await client.post(f"/api/v1/trips/{trip_id}/generate")
        assert gen_res.status_code == 503
        data = gen_res.json()
        assert data["error"]["code"] == "AI_CONFIG_ERROR"
        assert "not configured" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_generate_itinerary_mocked_success(client, mock_groq_response_payload):
    # 1. Create 2-day trip
    trip_payload = {
        "title": "Tokyo Highlights",
        "destination": "Tokyo, Japan",
        "start_date": "2026-07-01",
        "end_date": "2026-07-02",
        "budget": 1500.0,
        "currency": "USD",
        "travelers": 2,
        "travel_style": "Comfort",
        "pace": "Balanced"
    }
    create_res = await client.post("/api/v1/trips", json=trip_payload)
    trip_id = create_res.json()["id"]

    # 2. Mock Groq Service
    mock_service = MagicMock(spec=GroqService)
    real_service = GroqService(api_key="gsk_fake_mock_key_for_testing")
    from app.schemas.trip import TripResponse
    trip_resp = TripResponse(**create_res.json())
    mock_itinerary = real_service._assemble_itinerary_response(
        trip=trip_resp,
        assisted=mock_groq_response_payload,
        duration=2
    )

    async def fake_generate(trip):
        return mock_itinerary

    mock_service.generate_itinerary.side_effect = fake_generate
    app.dependency_overrides[get_groq_service] = lambda: mock_service

    # 3. Generate itinerary
    gen_res = await client.post(f"/api/v1/trips/{trip_id}/generate")
    assert gen_res.status_code == 200
    data = gen_res.json()

    assert data["destination"] == "Tokyo, Japan"
    assert len(data["days"]) == 2
    assert data["days"][0]["day_number"] == 1
    assert data["days"][0]["date"] == "2026-07-01"
    assert len(data["days"][0]["activities"]) == 2
    assert data["days"][1]["day_number"] == 2

    # Check budget calculations:
    # Day 1: Sensoji 0 + Sushi Lunch (30.00 * 2 people = 60.00)
    # Day 2: Meiji Jingu (0.00)
    # Total = 60.00
    assert data["budget_estimate"]["total_estimated_cost"] == 60.0
    assert data["budget_estimate"]["remaining_budget"] == 1440.0
    assert data["budget_estimate"]["cost_per_traveler"] == 30.0

    # 4. Check trip status updated to 'generated'
    trip_check = await client.get(f"/api/v1/trips/{trip_id}")
    assert trip_check.json()["status"] == "generated"
    assert trip_check.json()["has_itinerary"] is True


@pytest.mark.asyncio
async def test_regenerate_day_mocked_success(client, mock_groq_response_payload):
    # 1. Create trip
    trip_payload = {
        "title": "Kyoto Culture",
        "destination": "Kyoto, Japan",
        "start_date": "2026-07-01",
        "end_date": "2026-07-02",
        "budget": 1000.0,
        "currency": "USD",
        "travelers": 1
    }
    create_res = await client.post("/api/v1/trips", json=trip_payload)
    trip_id = create_res.json()["id"]

    # 2. Mock full generation first
    real_service = GroqService(api_key="gsk_fake_mock_key_for_testing")
    from app.schemas.trip import TripResponse
    trip_resp = TripResponse(**create_res.json())
    initial_itinerary = real_service._assemble_itinerary_response(
        trip=trip_resp,
        assisted=mock_groq_response_payload,
        duration=2
    )

    mock_service = MagicMock(spec=GroqService)
    mock_service.generate_itinerary.return_value = initial_itinerary

    # New single day response for Day 1
    target_day = initial_itinerary.days[0]
    new_day = target_day.model_copy(deep=True)
    new_day.theme = "Updated Temples & Gardens Theme"

    async def fake_regenerate_day(trip, day_number, target_date, day_id, other_days, additional_instructions=None):
        return new_day

    mock_service.regenerate_day.side_effect = fake_regenerate_day
    app.dependency_overrides[get_groq_service] = lambda: mock_service

    # Generate itinerary
    await client.post(f"/api/v1/trips/{trip_id}/generate")

    # Now regenerate day 1
    regen_res = await client.post(
        f"/api/v1/itinerary-days/{target_day.id}/regenerate",
        json={"additional_instructions": "Focus more on peaceful zen gardens"}
    )
    assert regen_res.status_code == 200
    regen_data = regen_res.json()
    assert regen_data["theme"] == "Updated Temples & Gardens Theme"


def test_groq_service_clean_json_and_validation():
    service = GroqService(api_key="gsk_fake_test_key")

    # Markdown fence cleaning
    raw_markdown = """```json
    {
        "days": [
            {
                "day_number": 1,
                "date": "2026-07-01",
                "theme": "Arrival",
                "notes": null,
                "accommodation_suggestion": "Hotel Central",
                "dining_suggestions": ["Bistro One"],
                "transportation_suggestions": ["Metro"],
                "activities": []
            }
        ],
        "general_travel_tips": ["Pack light"]
    }
    ```"""
    parsed = service._extract_and_validate_itinerary(raw_markdown)
    assert len(parsed.days) == 1
    assert parsed.days[0].theme == "Arrival"

    # Pre/Post text surrounding JSON
    noisy_text = "Here is your plan:\n" + raw_markdown.replace("```json", "").replace("```", "") + "\nEnjoy your trip!"
    parsed_noisy = service._extract_and_validate_itinerary(noisy_text)
    assert len(parsed_noisy.days) == 1

    # Malformed text should raise AIProviderException
    with pytest.raises(AIProviderException):
        service._extract_and_validate_itinerary("This is not JSON at all.")


@pytest.mark.asyncio
async def test_groq_service_authentication_error_handling():
    service = GroqService(api_key="gsk_fake_invalid_key")
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    resp = httpx.Response(401, request=req)
    mock_client.chat.completions.create.side_effect = AuthenticationError("Invalid API Key", response=resp, body=None)

    service._client = mock_client

    from app.schemas.trip import TripResponse
    fake_trip = TripResponse(
        id=uuid4(),
        title="Test Trip",
        destination="Kyoto, Japan",
        start_date="2026-08-01",
        end_date="2026-08-02",
        duration_days=2,
        budget=Decimal("500.00"),
        currency="USD",
        travelers=1
    )

    with pytest.raises(AIProviderException) as exc_info:
        await service.generate_itinerary(fake_trip)
    assert "authentication failed" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_groq_service_model_not_found_error_handling():
    service = GroqService(api_key="gsk_fake_key", model="non-existent-model")
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    resp = httpx.Response(404, request=req)
    mock_client.chat.completions.create.side_effect = NotFoundError("Model not found", response=resp, body=None)

    service._client = mock_client

    from app.schemas.trip import TripResponse
    fake_trip = TripResponse(
        id=uuid4(),
        title="Test Trip",
        destination="Kyoto, Japan",
        start_date="2026-08-01",
        end_date="2026-08-02",
        duration_days=2,
        budget=Decimal("500.00"),
        currency="USD",
        travelers=1
    )

    with pytest.raises(AIProviderException) as exc_info:
        await service.generate_itinerary(fake_trip)
    assert "non-existent-model" in str(exc_info.value)
    assert "not found" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_groq_service_rate_limit_error_handling():
    service = GroqService(api_key="gsk_fake_key")
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    resp = httpx.Response(429, request=req)
    mock_client.chat.completions.create.side_effect = RateLimitError("Rate limit exceeded", response=resp, body=None)

    service._client = mock_client

    from app.schemas.trip import TripResponse
    fake_trip = TripResponse(
        id=uuid4(),
        title="Test Trip",
        destination="Kyoto, Japan",
        start_date="2026-08-01",
        end_date="2026-08-02",
        duration_days=2,
        budget=Decimal("500.00"),
        currency="USD",
        travelers=1
    )

    with pytest.raises(AIProviderException) as exc_info:
        await service.generate_itinerary(fake_trip)
    assert "rate limit" in str(exc_info.value).lower()
