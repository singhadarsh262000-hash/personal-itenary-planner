from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse


class TripRepository(ABC):
    """Abstract interface for Trip persistence."""

    @abstractmethod
    async def create(self, trip_in: TripCreate) -> TripResponse:
        pass

    @abstractmethod
    async def get_by_id(self, trip_id: UUID) -> Optional[TripResponse]:
        pass

    @abstractmethod
    async def list_all(self) -> List[TripResponse]:
        pass

    @abstractmethod
    async def update(self, trip_id: UUID, trip_update: TripUpdate) -> Optional[TripResponse]:
        pass

    @abstractmethod
    async def update_status(self, trip_id: UUID, status: str, has_itinerary: Optional[bool] = None) -> Optional[TripResponse]:
        pass

    @abstractmethod
    async def delete(self, trip_id: UUID) -> bool:
        pass


class ItineraryRepository(ABC):
    """Abstract interface for Itinerary persistence."""

    @abstractmethod
    async def save_itinerary(self, itinerary: ItineraryResponse) -> ItineraryResponse:
        pass

    @abstractmethod
    async def get_by_trip_id(self, trip_id: UUID) -> Optional[ItineraryResponse]:
        pass

    @abstractmethod
    async def get_day_by_id(self, day_id: UUID) -> Optional[ItineraryDayResponse]:
        pass

    @abstractmethod
    async def update_day(self, day_id: UUID, day_data: ItineraryDayResponse) -> Optional[ItineraryDayResponse]:
        pass

    @abstractmethod
    async def add_activity(self, day_id: UUID, activity_in: ActivityCreate) -> Optional[ActivityResponse]:
        pass

    @abstractmethod
    async def get_activity_by_id(self, activity_id: UUID) -> Optional[tuple[ActivityResponse, UUID]]:
        """Returns tuple of (ActivityResponse, trip_id) or None."""
        pass

    @abstractmethod
    async def update_activity(self, activity_id: UUID, activity_update: ActivityUpdate) -> Optional[ActivityResponse]:
        pass

    @abstractmethod
    async def delete_activity(self, activity_id: UUID) -> Optional[UUID]:
        """Deletes activity and returns trip_id for budget recalculation, or None."""
        pass

    @abstractmethod
    async def reorder_activities(self, day_id: UUID, activity_ids: List[UUID]) -> Optional[List[ActivityResponse]]:
        pass

    @abstractmethod
    async def delete_by_trip_id(self, trip_id: UUID) -> bool:
        pass
