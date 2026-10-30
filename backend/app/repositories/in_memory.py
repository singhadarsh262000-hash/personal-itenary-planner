import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from uuid import UUID, uuid4
from app.repositories.base import TripRepository, ItineraryRepository
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.schemas.common import TripStatus
from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse


class InMemoryTripRepository(TripRepository):
    """
    In-memory storage implementation for Trip entities.
    WARNING: Ephemeral storage for local development. Data disappears upon backend restart.
    """

    def __init__(self):
        self._trips: Dict[UUID, TripResponse] = {}
        self._lock = asyncio.Lock()

    async def create(self, trip_in: TripCreate) -> TripResponse:
        async with self._lock:
            trip_id = uuid4()
            duration = (trip_in.end_date - trip_in.start_date).days + 1
            now = datetime.now(timezone.utc)
            
            title = trip_in.title or f"{trip_in.destination} Adventure"
            
            trip = TripResponse(
                id=trip_id,
                title=title,
                destination=trip_in.destination,
                start_date=trip_in.start_date,
                end_date=trip_in.end_date,
                duration_days=duration,
                budget=trip_in.budget,
                currency=trip_in.currency,
                travelers=trip_in.travelers,
                travel_style=trip_in.travel_style,
                interests=trip_in.interests,
                pace=trip_in.pace,
                accommodation_preference=trip_in.accommodation_preference,
                transportation_preference=trip_in.transportation_preference,
                dietary_preferences=trip_in.dietary_preferences,
                additional_instructions=trip_in.additional_instructions,
                status=TripStatus.DRAFT,
                has_itinerary=False,
                created_at=now,
                updated_at=now
            )
            self._trips[trip_id] = trip
            return trip

    async def get_by_id(self, trip_id: UUID) -> Optional[TripResponse]:
        async with self._lock:
            return self._trips.get(trip_id)

    async def list_all(self) -> List[TripResponse]:
        async with self._lock:
            # Sort newest first
            return sorted(self._trips.values(), key=lambda t: t.created_at, reverse=True)

    async def update(self, trip_id: UUID, trip_update: TripUpdate) -> Optional[TripResponse]:
        async with self._lock:
            if trip_id not in self._trips:
                return None
            
            current = self._trips[trip_id]
            data = current.model_dump()
            update_data = trip_update.model_dump(exclude_unset=True)
            data.update(update_data)
            data["updated_at"] = datetime.now(timezone.utc)
            
            updated_trip = TripResponse(**data)
            self._trips[trip_id] = updated_trip
            return updated_trip

    async def update_status(self, trip_id: UUID, status: str, has_itinerary: Optional[bool] = None) -> Optional[TripResponse]:
        async with self._lock:
            if trip_id not in self._trips:
                return None
            trip = self._trips[trip_id]
            data = trip.model_dump()
            data["status"] = status
            if has_itinerary is not None:
                data["has_itinerary"] = has_itinerary
            data["updated_at"] = datetime.now(timezone.utc)
            updated_trip = TripResponse(**data)
            self._trips[trip_id] = updated_trip
            return updated_trip

    async def delete(self, trip_id: UUID) -> bool:
        async with self._lock:
            if trip_id in self._trips:
                del self._trips[trip_id]
                return True
            return False


class InMemoryItineraryRepository(ItineraryRepository):
    """
    In-memory storage implementation for Itineraries, Days, and Activities.
    Maintains relational consistency in Python memory.
    """

    def __init__(self):
        # trip_id -> ItineraryResponse
        self._itineraries_by_trip: Dict[UUID, ItineraryResponse] = {}
        # day_id -> (trip_id, ItineraryDayResponse)
        self._days_index: Dict[UUID, Tuple[UUID, ItineraryDayResponse]] = {}
        # activity_id -> (day_id, trip_id, ActivityResponse)
        self._activities_index: Dict[UUID, Tuple[UUID, UUID, ActivityResponse]] = {}
        self._lock = asyncio.Lock()

    def _rebuild_indexes_for_itinerary(self, itinerary: ItineraryResponse):
        # Clear previous day/activity indexes for this trip
        trip_id = itinerary.trip_id
        days_to_remove = [d_id for d_id, (t_id, _) in self._days_index.items() if t_id == trip_id]
        for d_id in days_to_remove:
            del self._days_index[d_id]
            
        acts_to_remove = [a_id for a_id, (_, t_id, _) in self._activities_index.items() if t_id == trip_id]
        for a_id in acts_to_remove:
            del self._activities_index[a_id]

        # Index new days & activities
        for day in itinerary.days:
            self._days_index[day.id] = (trip_id, day)
            for act in day.activities:
                self._activities_index[act.id] = (day.id, trip_id, act)

    async def save_itinerary(self, itinerary: ItineraryResponse) -> ItineraryResponse:
        async with self._lock:
            self._itineraries_by_trip[itinerary.trip_id] = itinerary
            self._rebuild_indexes_for_itinerary(itinerary)
            return itinerary

    async def get_by_trip_id(self, trip_id: UUID) -> Optional[ItineraryResponse]:
        async with self._lock:
            return self._itineraries_by_trip.get(trip_id)

    async def get_day_by_id(self, day_id: UUID) -> Optional[ItineraryDayResponse]:
        async with self._lock:
            entry = self._days_index.get(day_id)
            if entry:
                return entry[1]
            return None

    async def update_day(self, day_id: UUID, day_data: ItineraryDayResponse) -> Optional[ItineraryDayResponse]:
        async with self._lock:
            entry = self._days_index.get(day_id)
            if not entry:
                return None
            trip_id, _ = entry
            itinerary = self._itineraries_by_trip.get(trip_id)
            if not itinerary:
                return None

            # Update day in itinerary.days list
            for idx, d in enumerate(itinerary.days):
                if d.id == day_id:
                    itinerary.days[idx] = day_data
                    break

            itinerary.updated_at = datetime.now(timezone.utc)
            self._rebuild_indexes_for_itinerary(itinerary)
            return day_data

    async def add_activity(self, day_id: UUID, activity_in: ActivityCreate) -> Optional[ActivityResponse]:
        async with self._lock:
            entry = self._days_index.get(day_id)
            if not entry:
                return None
            trip_id, day = entry
            itinerary = self._itineraries_by_trip.get(trip_id)
            if not itinerary:
                return None

            new_activity_id = uuid4()
            # Default sort order: end of list
            sort_order = activity_in.sort_order if activity_in.sort_order > 0 else (len(day.activities) + 1)
            
            activity = ActivityResponse(
                id=new_activity_id,
                day_id=day_id,
                name=activity_in.name,
                description=activity_in.description,
                category=activity_in.category,
                start_time=activity_in.start_time,
                end_time=activity_in.end_time,
                estimated_duration_minutes=activity_in.estimated_duration_minutes,
                location_name=activity_in.location_name,
                estimated_cost=activity_in.estimated_cost,
                currency=activity_in.currency,
                cost_basis=activity_in.cost_basis,
                sort_order=sort_order,
                notes=activity_in.notes,
                verification_status="estimated"
            )

            # Add to day
            day.activities.append(activity)
            day.activities.sort(key=lambda a: a.sort_order)
            itinerary.updated_at = datetime.now(timezone.utc)

            self._activities_index[new_activity_id] = (day_id, trip_id, activity)
            return activity

    async def get_activity_by_id(self, activity_id: UUID) -> Optional[tuple[ActivityResponse, UUID]]:
        async with self._lock:
            entry = self._activities_index.get(activity_id)
            if entry:
                _, trip_id, act = entry
                return (act, trip_id)
            return None

    async def update_activity(self, activity_id: UUID, activity_update: ActivityUpdate) -> Optional[ActivityResponse]:
        async with self._lock:
            entry = self._activities_index.get(activity_id)
            if not entry:
                return None
            day_id, trip_id, current_act = entry
            itinerary = self._itineraries_by_trip.get(trip_id)
            if not itinerary:
                return None

            update_data = activity_update.model_dump(exclude_unset=True)
            act_dict = current_act.model_dump()
            act_dict.update(update_data)
            updated_act = ActivityResponse(**act_dict)

            # Update within the day's activity list
            for day in itinerary.days:
                if day.id == day_id:
                    for i, a in enumerate(day.activities):
                        if a.id == activity_id:
                            day.activities[i] = updated_act
                            break
                    day.activities.sort(key=lambda a: a.sort_order)
                    break

            itinerary.updated_at = datetime.now(timezone.utc)
            self._activities_index[activity_id] = (day_id, trip_id, updated_act)
            return updated_act

    async def delete_activity(self, activity_id: UUID) -> Optional[UUID]:
        async with self._lock:
            entry = self._activities_index.get(activity_id)
            if not entry:
                return None
            day_id, trip_id, _ = entry
            itinerary = self._itineraries_by_trip.get(trip_id)
            if not itinerary:
                return None

            for day in itinerary.days:
                if day.id == day_id:
                    day.activities = [a for a in day.activities if a.id != activity_id]
                    # Re-normalize sort_order
                    for idx, a in enumerate(day.activities):
                        a.sort_order = idx + 1
                    break

            del self._activities_index[activity_id]
            itinerary.updated_at = datetime.now(timezone.utc)
            return trip_id

    async def reorder_activities(self, day_id: UUID, activity_ids: List[UUID]) -> Optional[List[ActivityResponse]]:
        async with self._lock:
            entry = self._days_index.get(day_id)
            if not entry:
                return None
            trip_id, day = entry
            itinerary = self._itineraries_by_trip.get(trip_id)
            if not itinerary:
                return None

            act_map = {a.id: a for a in day.activities}
            new_ordered: List[ActivityResponse] = []
            
            for idx, aid in enumerate(activity_ids):
                if aid in act_map:
                    act = act_map[aid]
                    act.sort_order = idx + 1
                    new_ordered.append(act)

            # Add any remaining activities not in the reorder list
            for aid, act in act_map.items():
                if aid not in activity_ids:
                    act.sort_order = len(new_ordered) + 1
                    new_ordered.append(act)

            day.activities = new_ordered
            itinerary.updated_at = datetime.now(timezone.utc)
            return day.activities

    async def delete_by_trip_id(self, trip_id: UUID) -> bool:
        async with self._lock:
            if trip_id in self._itineraries_by_trip:
                del self._itineraries_by_trip[trip_id]
                # Cleanup indexes
                days_to_remove = [d_id for d_id, (t_id, _) in self._days_index.items() if t_id == trip_id]
                for d_id in days_to_remove:
                    del self._days_index[d_id]
                acts_to_remove = [a_id for a_id, (_, t_id, _) in self._activities_index.items() if t_id == trip_id]
                for a_id in acts_to_remove:
                    del self._activities_index[a_id]
                return True
            return False
