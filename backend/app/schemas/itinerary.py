import datetime as dt
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from app.schemas.activity import ActivityResponse, ActivityBase
from app.schemas.budget import BudgetSummary
from app.schemas.common import ActivityCategory, CostBasis


class ItineraryDayBase(BaseModel):
    day_number: int = Field(..., ge=1, description="Day index 1, 2, ...")
    date: dt.date = Field(..., description="Date for this itinerary day")
    theme: str = Field(..., min_length=2, max_length=150, description="E.g. Historic Heart & Traditional Food")
    notes: Optional[str] = Field(default=None, max_length=1000)
    accommodation_suggestion: Optional[str] = Field(default=None, max_length=300)
    dining_suggestions: List[str] = Field(default_factory=list)
    transportation_suggestions: List[str] = Field(default_factory=list)


class ItineraryDayResponse(ItineraryDayBase):
    id: UUID = Field(default_factory=uuid4)
    trip_id: UUID
    activities: List[ActivityResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ItineraryResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    trip_id: UUID
    trip_title: str
    destination: str
    days: List[ItineraryDayResponse] = Field(default_factory=list)
    budget_estimate: BudgetSummary
    general_travel_tips: List[str] = Field(default_factory=list)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))
    updated_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))

    model_config = {"from_attributes": True}


# Pydantic schemas for AI Structured Output (Groq)
class AIAssistedActivity(BaseModel):
    name: str = Field(..., description="Activity or attraction title")
    description: str = Field(..., description="Detailed description of activity and why it fits preferences")
    category: ActivityCategory = Field(default=ActivityCategory.SIGHTSEEING)
    start_time: str = Field(..., description="HH:MM format in 24-hour time, e.g. 09:00")
    end_time: str = Field(..., description="HH:MM format in 24-hour time, e.g. 11:30")
    estimated_duration_minutes: int = Field(..., description="Duration in minutes, e.g. 120")
    location_name: str = Field(..., description="Specific place, venue, or neighborhood name")
    estimated_cost: Decimal = Field(default=Decimal("0.00"), description="Estimated price in requested currency")
    cost_basis: CostBasis = Field(default=CostBasis.PER_PERSON, description="per_person, per_group, per_night, total")
    notes: Optional[str] = Field(default=None, description="Optional tips or booking guidance")


class AIAssistedDay(BaseModel):
    day_number: int = Field(..., description="1-indexed day number")
    date: str = Field(..., description="YYYY-MM-DD corresponding to the trip day")
    theme: str = Field(..., description="Engaging thematic title for the day")
    notes: Optional[str] = Field(default=None)
    accommodation_suggestion: Optional[str] = Field(default=None, description="Recommended area or hotel style")
    dining_suggestions: List[str] = Field(default_factory=list, description="Curated breakfast, lunch, or dinner ideas")
    transportation_suggestions: List[str] = Field(default_factory=list, description="Transit or transit pass tips")
    activities: List[AIAssistedActivity] = Field(default_factory=list)


class AIAssistedItinerary(BaseModel):
    days: List[AIAssistedDay] = Field(..., description="List of days matching the trip duration")
    general_travel_tips: List[str] = Field(default_factory=list, description="Practical travel advice, customs, passes")
