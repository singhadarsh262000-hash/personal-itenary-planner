from datetime import date, timedelta
from typing import List
from uuid import UUID, uuid4
from decimal import Decimal
from fastapi import APIRouter, Depends, status
from app.api.deps import get_trip_service, get_itinerary_service
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripSummary
from app.schemas.itinerary import ItineraryResponse, ItineraryDayResponse
from app.schemas.activity import ActivityResponse
from app.schemas.common import TravelStyle, TravelPace, TripStatus, ActivityCategory, CostBasis
from app.services.trip_service import TripService
from app.services.itinerary_service import ItineraryService
from app.services.budget_service import BudgetCalculationService

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("/sample", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_sample_trip(
    trip_service: TripService = Depends(get_trip_service),
    itinerary_service: ItineraryService = Depends(get_itinerary_service)
):
    """Creates a pre-populated sample trip with an itinerary for demonstration and testing."""
    today = date.today()
    start = today + timedelta(days=14)
    end = today + timedelta(days=18)
    
    trip_in = TripCreate(
        title="Tokyo & Kyoto Highlights",
        destination="Tokyo & Kyoto, Japan",
        start_date=start,
        end_date=end,
        budget=Decimal("2500.00"),
        currency="USD",
        travelers=2,
        travel_style=TravelStyle.COMFORT,
        pace=TravelPace.BALANCED,
        interests=["Historical places", "Food & Gastronomy", "Architecture", "Local culture"],
        accommodation_preference="Boutique hotel near transit",
        transportation_preference="JR Pass & subway",
        dietary_preferences="No shellfish, love ramen & matcha",
        additional_instructions="Include Fushimi Inari at dawn and TeamLab"
    )
    
    trip = await trip_service.create_trip(trip_in)
    
    # Build sample days & activities
    days_data = [
        ("Historic Asakusa & Sumida River", [
            ("Senso-ji Temple Grounds", "Explore Tokyo's oldest temple and Nakamise-dori street food.", ActivityCategory.SIGHTSEEING, "09:30", "11:30", 120, "Asakusa, Tokyo", Decimal("0.00"), CostBasis.TOTAL),
            ("Edomae Sushi Lunch", "Seasonal nigiri sushi counter in the outer market.", ActivityCategory.DINING, "12:00", "13:30", 90, "Tsukiji Outer Market", Decimal("35.00"), CostBasis.PER_PERSON),
            ("Sumida River Water Bus", "Futuristic Himiko boat cruise down the river to Odaiba.", ActivityCategory.TRANSPORTATION, "14:30", "15:30", 60, "Asakusa Pier", Decimal("18.00"), CostBasis.PER_PERSON),
            ("Hotel Shinjuku Stay", "Modern boutique hotel near transit hub.", ActivityCategory.ACCOMMODATION, "16:30", "17:30", 60, "Shinjuku, Tokyo", Decimal("160.00"), CostBasis.PER_NIGHT),
        ]),
        ("Modern Shibuya & Meiji Shrine", [
            ("Meiji Jingu Shrine Walk", "Peaceful stroll through forested sacred shrine grounds.", ActivityCategory.CULTURE, "10:00", "11:45", 105, "Harajuku, Shibuya", Decimal("0.00"), CostBasis.TOTAL),
            ("Harajuku Crepes & Vintage Shops", "Explore Takeshita Street and boutique fashion.", ActivityCategory.SHOPPING, "12:00", "13:30", 90, "Harajuku", Decimal("15.00"), CostBasis.PER_PERSON),
            ("Shibuya Sky Observatory", "360-degree open-air rooftop observation deck overlooking the scramble crossing.", ActivityCategory.ACTIVITY, "15:00", "16:30", 90, "Shibuya Scramble Square", Decimal("22.00"), CostBasis.PER_PERSON),
            ("Golden Gai Izakaya Tasting", "Cozy dinner exploring micro-bars and charcoal-grilled yakitori.", ActivityCategory.DINING, "18:30", "20:30", 120, "Shinjuku Golden Gai", Decimal("40.00"), CostBasis.PER_PERSON),
        ]),
        ("Bullet Train to Kyoto & Fushimi Inari", [
            ("Tokaido Shinkansen Journey", "High-speed bullet train ride with views of Mount Fuji.", ActivityCategory.TRANSPORTATION, "08:30", "11:00", 150, "Tokyo to Kyoto Station", Decimal("130.00"), CostBasis.PER_PERSON),
            ("Traditional Kyoto Soba Lunch", "Handmade buckwheat noodles with seasonal tempura.", ActivityCategory.DINING, "12:00", "13:15", 75, "Kyoto Station Area", Decimal("20.00"), CostBasis.PER_PERSON),
            ("Fushimi Inari Taisha Hike", "Wander beneath thousands of vermilion torii gates winding up the sacred mountain.", ActivityCategory.SIGHTSEEING, "14:30", "17:00", 150, "Fushimi Ward, Kyoto", Decimal("0.00"), CostBasis.TOTAL),
        ]),
        ("Arashiyama Bamboo Grove & Temples", [
            ("Sagano Bamboo Forest Stroll", "Walk through towering emerald green bamboo stalks in early morning light.", ActivityCategory.NATURE, "09:00", "10:30", 90, "Arashiyama, Kyoto", Decimal("0.00"), CostBasis.TOTAL),
            ("Tenryu-ji Zen Garden", "UNESCO World Heritage Zen garden with Sogenchi pond.", ActivityCategory.CULTURE, "10:45", "12:00", 75, "Tenryu-ji Temple", Decimal("8.00"), CostBasis.PER_PERSON),
            ("Matcha & Parfait Tasting", "Historic tea salon overlooking the Katsura River.", ActivityCategory.DINING, "12:30", "13:30", 60, "Togetsukyo Bridge", Decimal("16.00"), CostBasis.PER_PERSON),
            ("Kinkaku-ji (Golden Pavilion)", "Gilded golden Zen pavilion reflecting across the mirror pond.", ActivityCategory.SIGHTSEEING, "15:00", "16:30", 90, "Kita Ward, Kyoto", Decimal("5.00"), CostBasis.PER_PERSON),
        ]),
        ("Historic Gion & Nishiki Market", [
            ("Nishiki Food Market Tour", "Explore Kyoto's 400-year-old pantry with skewers, mochi, and pickles.", ActivityCategory.DINING, "10:30", "12:30", 120, "Nakagyo Ward, Kyoto", Decimal("25.00"), CostBasis.PER_PERSON),
            ("Gion Geisha District Walking Tour", "Historic wooden machiya merchant houses and lantern-lit alleys.", ActivityCategory.CULTURE, "14:00", "16:00", 120, "Gion, Kyoto", Decimal("0.00"), CostBasis.TOTAL),
            ("Kaiseki Farewell Dinner", "Multi-course seasonal traditional culinary experience.", ActivityCategory.DINING, "18:00", "20:30", 150, "Pontocho Alley", Decimal("75.00"), CostBasis.PER_PERSON),
        ]),
    ]

    domain_days: List[ItineraryDayResponse] = []
    all_activities: List[ActivityResponse] = []

    for idx, (theme, acts) in enumerate(days_data):
        day_num = idx + 1
        day_date = start + timedelta(days=idx)
        day_id = uuid4()
        
        day_acts: List[ActivityResponse] = []
        for s_idx, (name, desc, cat, st, et, dur, loc, cost, basis) in enumerate(acts):
            act_id = uuid4()
            act = ActivityResponse(
                id=act_id,
                day_id=day_id,
                name=name,
                description=desc,
                category=cat,
                start_time=st,
                end_time=et,
                estimated_duration_minutes=dur,
                location_name=loc,
                estimated_cost=cost,
                currency=trip.currency,
                cost_basis=basis,
                sort_order=s_idx + 1,
                verification_status="estimated"
            )
            day_acts.append(act)
            all_activities.append(act)
            
        domain_day = ItineraryDayResponse(
            id=day_id,
            trip_id=trip.id,
            day_number=day_num,
            date=day_date,
            theme=theme,
            accommodation_suggestion="Machiya Inn or boutique central hotel",
            dining_suggestions=["Tsukiji Sushi", "Nishiki Market skewers", "Pontocho Alley Kaiseki"],
            transportation_suggestions=["JR 7-Day Rail Pass", "Tokyo Metro 72hr card"],
            activities=day_acts
        )
        domain_days.append(domain_day)

    budget_summary = BudgetCalculationService.calculate_budget(
        activities=all_activities,
        planned_budget=trip.budget,
        currency=trip.currency,
        travelers=trip.travelers,
        trip_days=trip.duration_days
    )

    itinerary = ItineraryResponse(
        id=uuid4(),
        trip_id=trip.id,
        trip_title=trip.title,
        destination=trip.destination,
        days=domain_days,
        budget_estimate=budget_summary,
        general_travel_tips=[
            "Pick up a digital or physical Suica/Pasmo card at Haneda/Narita airport.",
            "Coin lockers are widely available at major train stations for luggage storage.",
            "Tipping is not customary in Japan; exceptional service is standard.",
            "Many traditional temples and shrines require taking off your shoes at entry."
        ]
    )

    await itinerary_service.itinerary_repo.save_itinerary(itinerary)
    await trip_service.trip_repo.update_status(trip.id, TripStatus.GENERATED, has_itinerary=True)
    
    return await trip_service.get_trip(trip.id)


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_in: TripCreate,
    trip_service: TripService = Depends(get_trip_service)
):
    """Create a new trip request with preferences."""
    return await trip_service.create_trip(trip_in)


@router.get("", response_model=List[TripSummary])
async def list_trips(
    trip_service: TripService = Depends(get_trip_service)
):
    """List all trips stored in the current in-memory scope."""
    return await trip_service.list_trips()


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: UUID,
    trip_service: TripService = Depends(get_trip_service)
):
    """Retrieve full details of a single trip by ID."""
    return await trip_service.get_trip(trip_id)


@router.patch("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: UUID,
    trip_update: TripUpdate,
    trip_service: TripService = Depends(get_trip_service)
):
    """Update editable trip-level parameters and recalculate budget if necessary."""
    return await trip_service.update_trip(trip_id, trip_update)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: UUID,
    trip_service: TripService = Depends(get_trip_service)
):
    """Delete a trip and cascade delete its in-memory itinerary."""
    await trip_service.delete_trip(trip_id)
    return None
