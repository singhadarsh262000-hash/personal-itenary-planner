from typing import List, Optional
from uuid import UUID
from app.repositories.base import TripRepository, ItineraryRepository
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripSummary
from app.core.exceptions import ResourceNotFoundException


class TripService:
    def __init__(self, trip_repo: TripRepository, itinerary_repo: ItineraryRepository):
        self.trip_repo = trip_repo
        self.itinerary_repo = itinerary_repo

    async def create_trip(self, trip_in: TripCreate) -> TripResponse:
        return await self.trip_repo.create(trip_in)

    async def get_trip(self, trip_id: UUID) -> TripResponse:
        trip = await self.trip_repo.get_by_id(trip_id)
        if not trip:
            raise ResourceNotFoundException("Trip", str(trip_id))
        return trip

    async def list_trips(self) -> List[TripSummary]:
        trips = await self.trip_repo.list_all()
        return [
            TripSummary(
                id=t.id,
                title=t.title,
                destination=t.destination,
                start_date=t.start_date,
                end_date=t.end_date,
                duration_days=t.duration_days,
                budget=t.budget,
                currency=t.currency,
                travelers=t.travelers,
                travel_style=t.travel_style,
                status=t.status,
                has_itinerary=t.has_itinerary,
                created_at=t.created_at
            )
            for t in trips
        ]

    async def update_trip(self, trip_id: UUID, trip_update: TripUpdate) -> TripResponse:
        updated = await self.trip_repo.update(trip_id, trip_update)
        if not updated:
            raise ResourceNotFoundException("Trip", str(trip_id))
        
        # If budget or travelers changed, recalculate existing itinerary budget
        itinerary = await self.itinerary_repo.get_by_trip_id(trip_id)
        if itinerary and (trip_update.budget is not None or trip_update.travelers is not None):
            all_activities = [a for d in itinerary.days for a in d.activities]
            from app.services.budget_service import BudgetCalculationService
            itinerary.budget_estimate = BudgetCalculationService.calculate_budget(
                activities=all_activities,
                planned_budget=updated.budget,
                currency=updated.currency,
                travelers=updated.travelers,
                trip_days=updated.duration_days
            )
            await self.itinerary_repo.save_itinerary(itinerary)

        return updated

    async def delete_trip(self, trip_id: UUID) -> None:
        deleted = await self.trip_repo.delete(trip_id)
        if not deleted:
            raise ResourceNotFoundException("Trip", str(trip_id))
        # Cascade delete itinerary
        await self.itinerary_repo.delete_by_trip_id(trip_id)
