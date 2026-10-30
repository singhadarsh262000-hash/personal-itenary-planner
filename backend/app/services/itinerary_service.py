import logging
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, timezone

from app.core.exceptions import ResourceNotFoundException, AIProviderException
from app.repositories.base import TripRepository, ItineraryRepository
from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse
from app.schemas.common import TripStatus
from app.ai.groq_service import GroqService
from app.services.budget_service import BudgetCalculationService

logger = logging.getLogger(__name__)


class ItineraryService:
    def __init__(
        self,
        trip_repo: TripRepository,
        itinerary_repo: ItineraryRepository,
        groq_service: Optional[GroqService] = None,
        gemini_service: Optional[Any] = None
    ):
        self.trip_repo = trip_repo
        self.itinerary_repo = itinerary_repo
        self.groq_service = groq_service or gemini_service
        # Compatibility aliases
        self.gemini_service = self.groq_service

    async def _recalculate_and_save_budget(self, trip_id: UUID) -> Optional[ItineraryResponse]:
        itinerary = await self.itinerary_repo.get_by_trip_id(trip_id)
        if not itinerary:
            return None
        trip = await self.trip_repo.get_by_id(trip_id)
        if not trip:
            return itinerary

        all_acts = [a for day in itinerary.days for a in day.activities]
        itinerary.budget_estimate = BudgetCalculationService.calculate_budget(
            activities=all_acts,
            planned_budget=trip.budget,
            currency=trip.currency,
            travelers=trip.travelers,
            trip_days=trip.duration_days
        )
        itinerary.updated_at = datetime.now(timezone.utc)
        return await self.itinerary_repo.save_itinerary(itinerary)

    async def get_itinerary(self, trip_id: UUID) -> ItineraryResponse:
        # Check trip existence first
        trip = await self.trip_repo.get_by_id(trip_id)
        if not trip:
            raise ResourceNotFoundException("Trip", str(trip_id))

        itinerary = await self.itinerary_repo.get_by_trip_id(trip_id)
        if not itinerary:
            raise ResourceNotFoundException("Itinerary for Trip", str(trip_id))
        return itinerary

    async def generate_itinerary(self, trip_id: UUID) -> ItineraryResponse:
        trip = await self.trip_repo.get_by_id(trip_id)
        if not trip:
            raise ResourceNotFoundException("Trip", str(trip_id))

        existing_itinerary = await self.itinerary_repo.get_by_trip_id(trip_id)
        await self.trip_repo.update_status(trip_id, TripStatus.GENERATING)

        try:
            itinerary = await self.groq_service.generate_itinerary(trip)
            saved = await self.itinerary_repo.save_itinerary(itinerary)
            await self.trip_repo.update_status(trip_id, TripStatus.GENERATED, has_itinerary=True)
            return saved
        except Exception as e:
            logger.error(f"Failed to generate itinerary for trip {trip_id}: {e}")
            if not existing_itinerary:
                await self.trip_repo.update_status(trip_id, TripStatus.FAILED, has_itinerary=False)
            else:
                # Preserve previous status
                await self.trip_repo.update_status(trip_id, TripStatus.GENERATED, has_itinerary=True)
            raise

    async def regenerate_itinerary(self, trip_id: UUID) -> ItineraryResponse:
        """Regenerates the complete itinerary while preserving the previous plan on failure."""
        return await self.generate_itinerary(trip_id)

    async def regenerate_day(
        self,
        day_id: UUID,
        additional_instructions: Optional[str] = None
    ) -> ItineraryDayResponse:
        target_day = await self.itinerary_repo.get_day_by_id(day_id)
        if not target_day:
            raise ResourceNotFoundException("Itinerary Day", str(day_id))

        trip_id = target_day.trip_id
        trip = await self.trip_repo.get_by_id(trip_id)
        if not trip:
            raise ResourceNotFoundException("Trip", str(trip_id))

        itinerary = await self.itinerary_repo.get_by_trip_id(trip_id)
        other_days = [d for d in itinerary.days if d.id != day_id] if itinerary else []

        regenerated_day = await self.groq_service.regenerate_day(
            trip=trip,
            day_number=target_day.day_number,
            target_date=target_day.date,
            day_id=day_id,
            other_days=other_days,
            additional_instructions=additional_instructions
        )

        saved_day = await self.itinerary_repo.update_day(day_id, regenerated_day)
        await self._recalculate_and_save_budget(trip_id)
        return saved_day or regenerated_day

    async def add_activity(self, day_id: UUID, activity_in: ActivityCreate) -> ActivityResponse:
        target_day = await self.itinerary_repo.get_day_by_id(day_id)
        if not target_day:
            raise ResourceNotFoundException("Itinerary Day", str(day_id))

        created_activity = await self.itinerary_repo.add_activity(day_id, activity_in)
        if not created_activity:
            raise ResourceNotFoundException("Itinerary Day", str(day_id))

        await self._recalculate_and_save_budget(target_day.trip_id)
        return created_activity

    async def update_activity(self, activity_id: UUID, activity_update: ActivityUpdate) -> ActivityResponse:
        entry = await self.itinerary_repo.get_activity_by_id(activity_id)
        if not entry:
            raise ResourceNotFoundException("Activity", str(activity_id))
        _, trip_id = entry

        updated = await self.itinerary_repo.update_activity(activity_id, activity_update)
        if not updated:
            raise ResourceNotFoundException("Activity", str(activity_id))

        await self._recalculate_and_save_budget(trip_id)
        return updated

    async def delete_activity(self, activity_id: UUID) -> None:
        trip_id = await self.itinerary_repo.delete_activity(activity_id)
        if not trip_id:
            raise ResourceNotFoundException("Activity", str(activity_id))

        await self._recalculate_and_save_budget(trip_id)

    async def reorder_activities(self, day_id: UUID, activity_ids: List[UUID]) -> List[ActivityResponse]:
        target_day = await self.itinerary_repo.get_day_by_id(day_id)
        if not target_day:
            raise ResourceNotFoundException("Itinerary Day", str(day_id))

        reordered = await self.itinerary_repo.reorder_activities(day_id, activity_ids)
        if reordered is None:
            raise ResourceNotFoundException("Itinerary Day", str(day_id))
        return reordered
