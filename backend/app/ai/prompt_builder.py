from datetime import date, timedelta
from typing import List, Optional
from app.schemas.trip import TripResponse
from app.schemas.itinerary import ItineraryDayResponse


class PromptBuilder:
    """Constructs focused, structured system and user prompts for Groq itinerary generation."""

    @staticmethod
    def build_system_instruction() -> str:
        return (
            "You are an expert, meticulous AI travel planning architect and itinerary designer.\n"
            "Your objective is to generate practical, highly personalized, and logistically realistic day-by-day travel itineraries.\n"
            "Guidelines:\n"
            "1. Output MUST strictly match the requested JSON schema.\n"
            "2. Generate EXACTLY one day object for each calendar date in the requested range.\n"
            "3. Align activity density with the user's travel pace:\n"
            "   - 'Relaxed': 2 to 3 well-paced activities per day with ample downtime.\n"
            "   - 'Balanced': 3 to 4 activities per day with smooth transitions.\n"
            "   - 'Packed': 4 to 6 activities per day maximizing sightseeing.\n"
            "4. Chronological consistency: Activity start_time and end_time must be in 24-hour HH:MM format (e.g. '09:00', '13:30'). Activities within a day must be sequential without overlapping time slots.\n"
            "5. Realistic duration and travel time: Account for geographic proximity and realistic transit between venues.\n"
            "6. Financial realism: Provide reasonable market-rate estimated costs in the requested currency. Explicitly set cost_basis to one of ['per_person', 'per_group', 'per_night', 'total'].\n"
            "7. Clearly mark unverified information as suggestions; never fabricate fictitious reservation confirmation codes or promise live room availability.\n"
            "8. Always honor dietary restrictions in dining suggestions.\n"
            "9. Provide practical general travel tips (local transit cards, etiquette, tipping, safety).\n"
        )

    @classmethod
    def build_generate_itinerary_prompt(cls, trip: TripResponse) -> str:
        duration = (trip.end_date - trip.start_date).days + 1
        
        # Build date list
        date_list = [
            (trip.start_date + timedelta(days=i)).isoformat()
            for i in range(duration)
        ]
        dates_formatted = ", ".join(date_list)
        interests_str = ", ".join(trip.interests) if trip.interests else "General highlights, culture, food"

        return f"""
Please generate a complete day-by-day travel itinerary for the following trip:

=== TRIP DETAILS ===
Destination: {trip.destination}
Dates: {trip.start_date.isoformat()} to {trip.end_date.isoformat()} ({duration} days)
Exact Days Needed: {dates_formatted}
Total Planned Budget: {trip.currency} {trip.budget:,.2f}
Number of Travelers: {trip.travelers}
Travel Style: {trip.travel_style.value}
Travel Pace: {trip.pace.value}
Interests: {interests_str}
Accommodation Preference: {trip.accommodation_preference or "Standard boutique/hotel"}
Transportation Preference: {trip.transportation_preference or "Public transit, walking, occasional rideshare"}
Dietary Preferences: {trip.dietary_preferences or "None specified"}
Additional Instructions: {trip.additional_instructions or "None"}

=== INSTRUCTIONS ===
1. You must output an itinerary containing EXACTLY {duration} day objects, numbered 1 to {duration}, matching the dates: [{dates_formatted}].
2. For each day, include:
   - day_number (1 to {duration})
   - date (YYYY-MM-DD)
   - theme (concise title summarizing the day's highlights)
   - accommodation_suggestion (recommended neighborhood or lodging style)
   - dining_suggestions (2-3 authentic spots or food recommendations respecting dietary preferences)
   - transportation_suggestions (e.g. metro line, walking route, day pass recommendation)
   - activities: sequential activities with realistic 24-hour start_time ('HH:MM'), end_time ('HH:MM'), estimated_duration_minutes, location_name, estimated_cost (in {trip.currency}), and cost_basis ('per_person', 'per_group', 'per_night', 'total').
3. Include 4-6 general travel tips for {trip.destination}.
""".strip()

    @classmethod
    def build_regenerate_day_prompt(
        cls,
        trip: TripResponse,
        day_number: int,
        target_date: date,
        other_days: List[ItineraryDayResponse],
        additional_prompt: Optional[str] = None
    ) -> str:
        interests_str = ", ".join(trip.interests) if trip.interests else "General highlights"
        
        other_days_summary = []
        for d in other_days:
            if d.day_number != day_number:
                act_names = [a.name for a in d.activities[:3]]
                other_days_summary.append(f"Day {d.day_number} ({d.date}): {d.theme} -> {', '.join(act_names)}")
        other_summary_str = "\n".join(other_days_summary) if other_days_summary else "No other days"

        return f"""
Please regenerate ONLY Day {day_number} of the travel itinerary for {trip.destination}.

=== TRIP CONTEXT ===
Destination: {trip.destination}
Day to Regenerate: Day {day_number} on {target_date.isoformat()}
Travel Style: {trip.travel_style.value}
Travel Pace: {trip.pace.value}
Number of Travelers: {trip.travelers}
Currency: {trip.currency}
Interests: {interests_str}
Dietary Preferences: {trip.dietary_preferences or "None"}
Additional User Request: {additional_prompt or "Provide a fresh alternative itinerary for this day."}

=== EXISTING DAYS TO AVOID REPEATING ===
{other_summary_str}

=== INSTRUCTIONS ===
1. Generate a single cohesive day object for Day {day_number} ({target_date.isoformat()}).
2. Do not duplicate attractions or activities already scheduled on the other days listed above.
3. Keep start/end times sequential, realistic, and formatted in 24-hour 'HH:MM'.
4. Provide estimated costs in {trip.currency} with an appropriate cost_basis.
""".strip()
