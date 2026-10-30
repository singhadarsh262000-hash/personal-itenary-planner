from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.api.deps import get_itinerary_service
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse, ActivityReorderRequest
from app.services.itinerary_service import ItineraryService

router = APIRouter(tags=["Activities"])


@router.post("/itinerary-days/{day_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def add_activity(
    day_id: UUID,
    activity_in: ActivityCreate,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Add a new activity to an itinerary day and recalculate budget."""
    return await itinerary_service.add_activity(day_id, activity_in)


@router.patch("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: UUID,
    activity_update: ActivityUpdate,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Update details of an activity and recalculate budget."""
    return await itinerary_service.update_activity(activity_id, activity_update)


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: UUID,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Delete an activity and update budget estimates."""
    await itinerary_service.delete_activity(activity_id)
    return None


@router.post("/itinerary-days/{day_id}/activities/reorder", response_model=List[ActivityResponse])
async def reorder_activities(
    day_id: UUID,
    reorder_in: ActivityReorderRequest,
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Reorder activities within an itinerary day."""
    return await itinerary_service.reorder_activities(day_id, reorder_in.activity_ids)
