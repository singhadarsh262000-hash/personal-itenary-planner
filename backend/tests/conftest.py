import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.repositories.in_memory import InMemoryTripRepository, InMemoryItineraryRepository
from app.api.deps import get_trip_repository, get_itinerary_repository, get_groq_service, get_gemini_service
from app.ai.groq_service import GroqService
# Compatibility alias
GeminiService = GroqService


@pytest.fixture
def mock_trip_repo():
    return InMemoryTripRepository()


@pytest.fixture
def mock_itinerary_repo():
    return InMemoryItineraryRepository()


@pytest.fixture
async def client(mock_trip_repo, mock_itinerary_repo):
    # Override dependencies for isolated test state
    app.dependency_overrides[get_trip_repository] = lambda: mock_trip_repo
    app.dependency_overrides[get_itinerary_repository] = lambda: mock_itinerary_repo
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
        
    app.dependency_overrides.clear()
