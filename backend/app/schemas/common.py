from enum import Enum
from decimal import Decimal
from typing import Annotated
from pydantic import PlainSerializer

CurrencyAmount = Annotated[
    Decimal,
    PlainSerializer(lambda x: float(round(Decimal(str(x)), 2)) if x is not None else None, return_type=float)
]


class TravelStyle(str, Enum):
    BUDGET = "Budget"
    COMFORT = "Comfort"
    LUXURY = "Luxury"
    ADVENTURE = "Adventure"
    CULTURAL = "Cultural exploration"
    ROMANTIC = "Romantic getaway"


class TravelPace(str, Enum):
    RELAXED = "Relaxed"
    BALANCED = "Balanced"
    PACKED = "Packed"


class ActivityCategory(str, Enum):
    SIGHTSEEING = "Sightseeing"
    DINING = "Dining"
    TRANSPORTATION = "Transportation"
    ACCOMMODATION = "Accommodation"
    ACTIVITY = "Activity"
    CULTURE = "Culture"
    RELAXATION = "Relaxation"
    NIGHTLIFE = "Nightlife"
    SHOPPING = "Shopping"
    NATURE = "Nature"
    OTHER = "Other"


class CostBasis(str, Enum):
    PER_PERSON = "per_person"
    PER_GROUP = "per_group"
    PER_NIGHT = "per_night"
    TOTAL = "total"


class TripStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    GENERATED = "generated"
    FAILED = "failed"
