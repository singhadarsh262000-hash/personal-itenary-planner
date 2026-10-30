from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status
from app.api.deps import get_itinerary_service
from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.services.itinerary_service import ItineraryService

router = APIRouter(tags=["Itineraries"])


class RegenerateDayRequest(BaseModel):
    additional_instructions: Optional[str] = Field(None, max_length=500, description="Optional focus or requests for day regeneration")


@router.post("/trips/{trip_id}/generate", response_model=ItineraryResponse)
async def generate_itinerary(
    trip_id: UUID,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Generate a complete day-by-day travel plan using Gemini AI."""
    return await itinerary_service.generate_itinerary(trip_id)


@router.get("/trips/{trip_id}/itinerary", response_model=ItineraryResponse)
async def get_itinerary(
    trip_id: UUID,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Retrieve the saved itinerary for a trip."""
    return await itinerary_service.get_itinerary(trip_id)


@router.post("/trips/{trip_id}/regenerate", response_model=ItineraryResponse)
async def regenerate_itinerary(
    trip_id: UUID,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Regenerate the entire itinerary while preserving the trip preferences."""
    return await itinerary_service.regenerate_itinerary(trip_id)


@router.post("/itinerary-days/{day_id}/regenerate", response_model=ItineraryDayResponse)
async def regenerate_day(
    day_id: UUID,
    req: Optional[RegenerateDayRequest] = None,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Regenerate a single day of the itinerary with fresh AI suggestions."""
    instructions = req.additional_instructions if req else None
    return await itinerary_service.regenerate_day(day_id, additional_instructions=instructions)
