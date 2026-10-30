import json
import logging
import re
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4

from groq import (
    Groq,
    GroqError,
    APIError,
    RateLimitError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    APITimeoutError,
)

from app.core.config import settings
from app.core.exceptions import AIConfigurationException, AIProviderException
from app.schemas.trip import TripResponse
from app.schemas.itinerary import (
    AIAssistedItinerary,
    AIAssistedDay,
    ItineraryResponse,
    ItineraryDayResponse,
)
from app.schemas.activity import ActivityResponse
from app.schemas.common import ActivityCategory, CostBasis
from app.ai.prompt_builder import PromptBuilder
from app.services.budget_service import BudgetCalculationService

logger = logging.getLogger(__name__)


class GroqService:
    """Service for interacting with Groq API to generate travel itineraries."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = model if model is not None else settings.GROQ_MODEL
        self._client: Optional[Groq] = None

    def _get_client(self) -> Groq:
        if not self.api_key or self.api_key.strip() in ("", "your_groq_api_key_here"):
            raise AIConfigurationException(
                "Groq API key is not configured. Please add a valid GROQ_API_KEY in backend/.env"
            )
        if self._client is None:
            self._client = Groq(
                api_key=self.api_key.strip(),
                timeout=float(settings.AI_TIMEOUT_SECONDS)
            )
        return self._client

    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Removes markdown code fences and cleans trailing noise."""
        cleaned = text.strip()
        # Remove ```json and ``` fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        return cleaned.strip()

    def _extract_and_validate_itinerary(self, raw_text: str) -> AIAssistedItinerary:
        cleaned = self._clean_json_text(raw_text)
        try:
            return AIAssistedItinerary.model_validate_json(cleaned)
        except Exception as e:
            logger.warning(f"Initial JSON parse failed: {e}. Attempting JSON block extraction...")
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return AIAssistedItinerary.model_validate_json(match.group(0))
                except Exception as inner_e:
                    logger.error(f"Failed to parse extracted JSON block: {inner_e}")
            raise AIProviderException(f"Failed to parse structured itinerary from Groq: {e}")

    def _extract_and_validate_day(self, raw_text: str) -> AIAssistedDay:
        cleaned = self._clean_json_text(raw_text)
        try:
            return AIAssistedDay.model_validate_json(cleaned)
        except Exception as e:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return AIAssistedDay.model_validate_json(match.group(0))
                except Exception:
                    pass
            raise AIProviderException(f"Failed to parse structured day from Groq: {e}")

    async def generate_itinerary(self, trip: TripResponse) -> ItineraryResponse:
        """Generates a complete day-by-day itinerary using Groq API."""
        client = self._get_client()
        prompt = PromptBuilder.build_generate_itinerary_prompt(trip)
        system_instruction = PromptBuilder.build_system_instruction()

        duration = (trip.end_date - trip.start_date).days + 1
        schema = AIAssistedItinerary.model_json_schema()
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        last_error = None

        for attempt in range(1, settings.AI_MAX_RETRIES + 2):
            try:
                logger.info(f"Invoking Groq model '{self.model}' (attempt {attempt}/{settings.AI_MAX_RETRIES + 1})...")

                try:
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        response_format={
                            "type": "json_schema",
                            "json_schema": {
                                "name": "ai_assisted_itinerary",
                                "schema": schema,
                            }
                        },
                        temperature=0.3,
                    )
                except BadRequestError as b_err:
                    err_msg = str(b_err).lower()
                    if "json_schema" in err_msg or "response_format" in err_msg:
                        logger.warning(f"Model '{self.model}' does not support json_schema, falling back to json_object...")
                        fallback_messages = [
                            {
                                "role": "system",
                                "content": f"{system_instruction}\nStrictly output valid JSON matching this schema:\n{json.dumps(schema)}"
                            },
                            {"role": "user", "content": prompt}
                        ]
                        response = client.chat.completions.create(
                            model=self.model,
                            messages=fallback_messages,
                            response_format={"type": "json_object"},
                            temperature=0.3,
                        )
                    else:
                        raise

                if not response.choices or not response.choices[0].message or not response.choices[0].message.content:
                    raise AIProviderException("Groq returned an empty response.")

                raw_text = response.choices[0].message.content
                assisted_itinerary = self._extract_and_validate_itinerary(raw_text)
                return self._assemble_itinerary_response(trip, assisted_itinerary, duration)

            except AIConfigurationException:
                raise
            except AuthenticationError as e:
                logger.error(f"Groq authentication failure: {e}")
                raise AIProviderException(
                    "Groq authentication failed. Please check that GROQ_API_KEY is correct in backend/.env."
                ) from e
            except NotFoundError as e:
                logger.error(f"Groq model not found: {e}")
                raise AIProviderException(
                    f"Groq model '{self.model}' was not found or is unavailable. Please verify GROQ_MODEL in backend/.env."
                ) from e
            except RateLimitError as e:
                last_error = e
                logger.warning(f"Groq rate limit hit (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException("Groq API rate limit exceeded. Please wait a moment and try again.") from e
            except (APIConnectionError, APITimeoutError) as e:
                last_error = e
                logger.warning(f"Groq connection/timeout error (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException(f"Connection to Groq API timed out or failed: {e}") from e
            except AIProviderException as e:
                last_error = e
                logger.warning(f"Groq itinerary validation failed (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise
            except Exception as e:
                last_error = e
                logger.warning(f"Groq generation attempt {attempt} failed: {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException(
                        f"Groq itinerary generation failed after {settings.AI_MAX_RETRIES + 1} attempts: {e}"
                    ) from e

        raise AIProviderException(f"Groq generation failed after {settings.AI_MAX_RETRIES + 1} attempts: {last_error}")

    def _assemble_itinerary_response(
        self,
        trip: TripResponse,
        assisted: AIAssistedItinerary,
        duration: int
    ) -> ItineraryResponse:
        """Maps AI output to verified domain models, assigning UUIDs and calculating authoritative budget."""
        itinerary_id = uuid4()
        now = datetime.now(timezone.utc)

        domain_days: List[ItineraryDayResponse] = []
        all_activities: List[ActivityResponse] = []

        for i in range(duration):
            day_num = i + 1
            expected_date = trip.start_date + timedelta(days=i)
            day_id = uuid4()

            ai_day = None
            if i < len(assisted.days):
                ai_day = assisted.days[i]

            theme = ai_day.theme if ai_day and ai_day.theme else f"Exploring {trip.destination} - Day {day_num}"
            accommodation = ai_day.accommodation_suggestion if ai_day else trip.accommodation_preference
            dining = ai_day.dining_suggestions if ai_day else []
            transit = ai_day.transportation_suggestions if ai_day else []
            notes = ai_day.notes if ai_day else None

            day_activities: List[ActivityResponse] = []
            if ai_day and ai_day.activities:
                for idx, act in enumerate(ai_day.activities):
                    act_id = uuid4()
                    domain_act = ActivityResponse(
                        id=act_id,
                        day_id=day_id,
                        name=act.name,
                        description=act.description,
                        category=act.category,
                        start_time=act.start_time,
                        end_time=act.end_time,
                        estimated_duration_minutes=act.estimated_duration_minutes,
                        location_name=act.location_name,
                        estimated_cost=act.estimated_cost,
                        currency=trip.currency,
                        cost_basis=act.cost_basis,
                        sort_order=idx + 1,
                        notes=act.notes,
                        verification_status="estimated"
                    )
                    day_activities.append(domain_act)
                    all_activities.append(domain_act)

            domain_day = ItineraryDayResponse(
                id=day_id,
                trip_id=trip.id,
                day_number=day_num,
                date=expected_date,
                theme=theme,
                notes=notes,
                accommodation_suggestion=accommodation,
                dining_suggestions=dining,
                transportation_suggestions=transit,
                activities=day_activities
            )
            domain_days.append(domain_day)

        # Authoritative budget calculation
        budget_summary = BudgetCalculationService.calculate_budget(
            activities=all_activities,
            planned_budget=trip.budget,
            currency=trip.currency,
            travelers=trip.travelers,
            trip_days=duration
        )

        general_tips = assisted.general_travel_tips or [
            f"Familiarize yourself with local etiquette in {trip.destination}.",
            "Keep emergency contact numbers and accommodation details handy.",
            "Verify local attraction opening hours and ticket availability before departing each morning."
        ]

        return ItineraryResponse(
            id=itinerary_id,
            trip_id=trip.id,
            trip_title=trip.title or f"{trip.destination} Trip",
            destination=trip.destination,
            days=domain_days,
            budget_estimate=budget_summary,
            general_travel_tips=general_tips,
            created_at=now,
            updated_at=now
        )

    async def regenerate_day(
        self,
        trip: TripResponse,
        day_number: int,
        target_date: date,
        day_id: UUID,
        other_days: List[ItineraryDayResponse],
        additional_instructions: Optional[str] = None
    ) -> ItineraryDayResponse:
        """Regenerates a single day with fresh suggestions using Groq API."""
        client = self._get_client()
        prompt = PromptBuilder.build_regenerate_day_prompt(
            trip=trip,
            day_number=day_number,
            target_date=target_date,
            other_days=other_days,
            additional_prompt=additional_instructions
        )
        system_instruction = PromptBuilder.build_system_instruction()
        schema = AIAssistedDay.model_json_schema()

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        last_error = None

        for attempt in range(1, settings.AI_MAX_RETRIES + 2):
            try:
                logger.info(f"Invoking Groq day regeneration (attempt {attempt}/{settings.AI_MAX_RETRIES + 1})...")

                try:
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        response_format={
                            "type": "json_schema",
                            "json_schema": {
                                "name": "ai_assisted_day",
                                "schema": schema,
                            }
                        },
                        temperature=0.4,
                    )
                except BadRequestError as b_err:
                    err_msg = str(b_err).lower()
                    if "json_schema" in err_msg or "response_format" in err_msg:
                        fallback_messages = [
                            {
                                "role": "system",
                                "content": f"{system_instruction}\nStrictly output valid JSON matching this schema:\n{json.dumps(schema)}"
                            },
                            {"role": "user", "content": prompt}
                        ]
                        response = client.chat.completions.create(
                            model=self.model,
                            messages=fallback_messages,
                            response_format={"type": "json_object"},
                            temperature=0.4,
                        )
                    else:
                        raise

                if not response.choices or not response.choices[0].message or not response.choices[0].message.content:
                    raise AIProviderException("Groq returned an empty response for day regeneration.")

                assisted_day = self._extract_and_validate_day(response.choices[0].message.content)

                # Assemble day response
                day_activities: List[ActivityResponse] = []
                for idx, act in enumerate(assisted_day.activities):
                    act_id = uuid4()
                    day_activities.append(ActivityResponse(
                        id=act_id,
                        day_id=day_id,
                        name=act.name,
                        description=act.description,
                        category=act.category,
                        start_time=act.start_time,
                        end_time=act.end_time,
                        estimated_duration_minutes=act.estimated_duration_minutes,
                        location_name=act.location_name,
                        estimated_cost=act.estimated_cost,
                        currency=trip.currency,
                        cost_basis=act.cost_basis,
                        sort_order=idx + 1,
                        notes=act.notes,
                        verification_status="estimated"
                    ))

                return ItineraryDayResponse(
                    id=day_id,
                    trip_id=trip.id,
                    day_number=day_number,
                    date=target_date,
                    theme=assisted_day.theme or f"{trip.destination} Highlights",
                    notes=assisted_day.notes,
                    accommodation_suggestion=assisted_day.accommodation_suggestion,
                    dining_suggestions=assisted_day.dining_suggestions,
                    transportation_suggestions=assisted_day.transportation_suggestions,
                    activities=day_activities
                )

            except AIConfigurationException:
                raise
            except AuthenticationError as e:
                logger.error(f"Groq authentication failure: {e}")
                raise AIProviderException(
                    "Groq authentication failed. Please check that GROQ_API_KEY is correct in backend/.env."
                ) from e
            except NotFoundError as e:
                logger.error(f"Groq model not found: {e}")
                raise AIProviderException(
                    f"Groq model '{self.model}' was not found or is unavailable. Please verify GROQ_MODEL in backend/.env."
                ) from e
            except RateLimitError as e:
                last_error = e
                logger.warning(f"Groq rate limit hit during day regeneration (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException("Groq API rate limit exceeded. Please wait a moment and try again.") from e
            except (APIConnectionError, APITimeoutError) as e:
                last_error = e
                logger.warning(f"Groq connection/timeout error during day regeneration (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException(f"Connection to Groq API timed out or failed: {e}") from e
            except AIProviderException as e:
                last_error = e
                logger.warning(f"Groq day validation failed (attempt {attempt}): {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise
            except Exception as e:
                last_error = e
                logger.warning(f"Groq single-day regeneration attempt {attempt} failed: {e}")
                if attempt > settings.AI_MAX_RETRIES:
                    raise AIProviderException(f"Single day regeneration failed: {e}") from e

        raise AIProviderException(f"Single day regeneration failed after {settings.AI_MAX_RETRIES + 1} attempts: {last_error}")
