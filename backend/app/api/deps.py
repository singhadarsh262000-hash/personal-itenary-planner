from fastapi import Depends
from app.repositories.base import TripRepository, ItineraryRepository
from app.repositories.in_memory import InMemoryTripRepository, InMemoryItineraryRepository
from app.ai.groq_service import GroqService
from app.services.trip_service import TripService
from app.services.itinerary_service import ItineraryService

# Singletons for in-memory repositories during local development
_trip_repository = InMemoryTripRepository()
_itinerary_repository = InMemoryItineraryRepository()
_groq_service = GroqService()


def get_trip_repository() -> TripRepository:
    return _trip_repository


def get_itinerary_repository() -> ItineraryRepository:
    return _itinerary_repository


def get_groq_service() -> GroqService:
    return _groq_service


# Backwards compatibility alias
get_gemini_service = get_groq_service


def get_trip_service(
    trip_repo: TripRepository = Depends(get_trip_repository),
    itinerary_repo: ItineraryRepository = Depends(get_itinerary_repository)
) -> TripService:
    return TripService(trip_repo=trip_repo, itinerary_repo=itinerary_repo)


def get_itinerary_service(
    trip_repo: TripRepository = Depends(get_trip_repository),
    itinerary_repo: ItineraryRepository = Depends(get_itinerary_repository),
    groq_service: GroqService = Depends(get_groq_service)
) -> ItineraryService:
    return ItineraryService(
        trip_repo=trip_repo,
        itinerary_repo=itinerary_repo,
        groq_service=groq_service
    )
