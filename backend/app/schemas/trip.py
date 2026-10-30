from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, field_validator, model_validator
from app.schemas.common import TravelStyle, TravelPace, TripStatus, CurrencyAmount


class TripBase(BaseModel):
    title: Optional[str] = Field(None, max_length=150, description="Optional custom trip title")
    destination: str = Field(..., min_length=2, max_length=150, description="City, country or region")
    start_date: date = Field(..., description="Trip start date (YYYY-MM-DD)")
    end_date: date = Field(..., description="Trip end date (YYYY-MM-DD)")
    budget: CurrencyAmount = Field(..., gt=0, description="Total planned budget")
    currency: str = Field(default="USD", min_length=3, max_length=5, description="ISO currency code, e.g. USD, EUR, JPY, GBP, INR")
    travelers: int = Field(default=1, ge=1, le=30, description="Number of travelers")
    travel_style: TravelStyle = Field(default=TravelStyle.COMFORT)
    interests: List[str] = Field(default_factory=list, description="Travel interests: Food, Culture, Nature, etc.")
    pace: TravelPace = Field(default=TravelPace.BALANCED)
    accommodation_preference: Optional[str] = Field(None, max_length=200)
    transportation_preference: Optional[str] = Field(None, max_length=200)
    dietary_preferences: Optional[str] = Field(None, max_length=200)
    additional_instructions: Optional[str] = Field(None, max_length=1000)

    @field_validator("budget", mode="before")
    @classmethod
    def validate_budget(cls, v):
        if isinstance(v, (int, float, str)):
            d = round(Decimal(str(v)), 2)
            if d <= 0:
                raise ValueError("Budget must be greater than zero.")
            return d
        return v

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        return v.upper().strip()

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        duration = (self.end_date - self.start_date).days + 1
        if duration > 14:
            raise ValueError(f"Trip duration is {duration} days, which exceeds the maximum limit of 14 days.")
        return self


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    budget: Optional[CurrencyAmount] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=5)
    travelers: Optional[int] = Field(None, ge=1, le=30)
    travel_style: Optional[TravelStyle] = None
    interests: Optional[List[str]] = None
    pace: Optional[TravelPace] = None
    accommodation_preference: Optional[str] = Field(None, max_length=200)
    transportation_preference: Optional[str] = Field(None, max_length=200)
    dietary_preferences: Optional[str] = Field(None, max_length=200)
    additional_instructions: Optional[str] = Field(None, max_length=1000)

    @field_validator("budget", mode="before")
    @classmethod
    def validate_budget(cls, v):
        if v is not None and isinstance(v, (int, float, str)):
            d = round(Decimal(str(v)), 2)
            if d <= 0:
                raise ValueError("Budget must be greater than zero.")
            return d
        return v


class TripResponse(TripBase):
    id: UUID = Field(default_factory=uuid4)
    duration_days: int = Field(..., ge=1)
    status: TripStatus = Field(default=TripStatus.DRAFT)
    has_itinerary: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"from_attributes": True}


class TripSummary(BaseModel):
    id: UUID
    title: str
    destination: str
    start_date: date
    end_date: date
    duration_days: int
    budget: CurrencyAmount
    currency: str
    travelers: int
    travel_style: TravelStyle
    status: TripStatus
    has_itinerary: bool
    created_at: datetime

    model_config = {"from_attributes": True}
