from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import ActivityCategory, CostBasis, CurrencyAmount


class ActivityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Name or title of activity")
    description: str = Field(..., min_length=1, max_length=1000, description="Description of the activity")
    category: ActivityCategory = Field(default=ActivityCategory.SIGHTSEEING, description="Category of activity")
    start_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="24-hour time HH:MM, e.g. 09:30")
    end_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="24-hour time HH:MM, e.g. 11:30")
    estimated_duration_minutes: int = Field(..., ge=5, le=1440, description="Duration in minutes")
    location_name: str = Field(..., min_length=1, max_length=150, description="Name of the place/attraction")
    estimated_cost: CurrencyAmount = Field(default=Decimal("0.00"), ge=0, description="Estimated cost in specified currency")
    currency: str = Field(default="USD", min_length=3, max_length=5, description="ISO currency code")
    cost_basis: CostBasis = Field(default=CostBasis.PER_PERSON, description="Cost basis: per_person, per_group, per_night, total")
    sort_order: int = Field(default=0, ge=0)
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("estimated_cost", mode="before")
    @classmethod
    def validate_cost(cls, v):
        if isinstance(v, (int, float, str)):
            return round(Decimal(str(v)), 2)
        return v


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    category: Optional[ActivityCategory] = None
    start_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    end_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    estimated_duration_minutes: Optional[int] = Field(None, ge=5, le=1440)
    location_name: Optional[str] = Field(None, min_length=1, max_length=150)
    estimated_cost: Optional[CurrencyAmount] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=5)
    cost_basis: Optional[CostBasis] = None
    sort_order: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("estimated_cost", mode="before")
    @classmethod
    def validate_cost(cls, v):
        if v is not None and isinstance(v, (int, float, str)):
            return round(Decimal(str(v)), 2)
        return v


class ActivityResponse(ActivityBase):
    id: UUID = Field(default_factory=uuid4)
    day_id: UUID
    verification_status: str = Field(default="estimated", description="Indicates estimate status, e.g. 'estimated' or 'unverified'")

    model_config = {"from_attributes": True}


class ActivityReorderRequest(BaseModel):
    activity_ids: list[UUID] = Field(..., min_length=1, description="Ordered list of activity UUIDs for the day")
