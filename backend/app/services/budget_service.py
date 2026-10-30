from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict
from app.schemas.activity import ActivityResponse
from app.schemas.budget import BudgetSummary, CategoryBudgetBreakdown
from app.schemas.common import ActivityCategory, CostBasis


class BudgetCalculationService:
    """
    Authoritative deterministic budget engine.
    Calculates unified category expenses from varied cost bases.
    """

    PRIMARY_CATEGORIES = [
        "Accommodation",
        "Food",
        "Transportation",
        "Activities",
        "Miscellaneous"
    ]

    @staticmethod
    def map_category_to_bucket(category: ActivityCategory) -> str:
        if category == ActivityCategory.ACCOMMODATION:
            return "Accommodation"
        elif category == ActivityCategory.DINING:
            return "Food"
        elif category == ActivityCategory.TRANSPORTATION:
            return "Transportation"
        elif category in [
            ActivityCategory.SIGHTSEEING,
            ActivityCategory.ACTIVITY,
            ActivityCategory.CULTURE,
            ActivityCategory.RELAXATION,
            ActivityCategory.NIGHTLIFE,
            ActivityCategory.SHOPPING,
            ActivityCategory.NATURE
        ]:
            return "Activities"
        return "Miscellaneous"

    @classmethod
    def calculate_effective_cost(
        cls,
        base_cost: Decimal,
        cost_basis: CostBasis,
        travelers: int,
        trip_days: int
    ) -> Decimal:
        """
        Converts varied cost bases into the effective total expense:
        - per_person: cost * travelers
        - per_group: cost
        - per_night: cost * nights (nights = max(1, trip_days - 1))
        - total: cost
        """
        if base_cost <= 0:
            return Decimal("0.00")

        if cost_basis == CostBasis.PER_PERSON:
            return base_cost * Decimal(travelers)
        elif cost_basis == CostBasis.PER_NIGHT:
            nights = max(1, trip_days - 1)
            return base_cost * Decimal(nights)
        elif cost_basis in (CostBasis.PER_GROUP, CostBasis.TOTAL):
            return base_cost
        
        # Default fallback
        return base_cost * Decimal(travelers)

    @classmethod
    def calculate_budget(
        cls,
        activities: List[ActivityResponse],
        planned_budget: Decimal,
        currency: str,
        travelers: int,
        trip_days: int
    ) -> BudgetSummary:
        planned_budget = Decimal(str(planned_budget)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        travelers = max(1, travelers)
        trip_days = max(1, trip_days)

        # Initialize bucket stats
        bucket_costs: Dict[str, Decimal] = {cat: Decimal("0.00") for cat in cls.PRIMARY_CATEGORIES}
        bucket_counts: Dict[str, int] = {cat: 0 for cat in cls.PRIMARY_CATEGORIES}

        total_cost = Decimal("0.00")

        for act in activities:
            bucket = cls.map_category_to_bucket(act.category)
            effective = cls.calculate_effective_cost(
                base_cost=act.estimated_cost,
                cost_basis=act.cost_basis,
                travelers=travelers,
                trip_days=trip_days
            )
            bucket_costs[bucket] += effective
            bucket_counts[bucket] += 1
            total_cost += effective

        total_cost = total_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        remaining = planned_budget - total_cost
        is_over = total_cost > planned_budget
        over_amount = (total_cost - planned_budget) if is_over else Decimal("0.00")

        cost_per_traveler = (total_cost / Decimal(travelers)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Build category breakdowns with percentages
        category_breakdowns: Dict[str, CategoryBudgetBreakdown] = {}
        for cat in cls.PRIMARY_CATEGORIES:
            cat_subtotal = bucket_costs[cat].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            percentage = float((cat_subtotal / total_cost * 100).quantize(Decimal("0.1"))) if total_cost > 0 else 0.0
            category_breakdowns[cat] = CategoryBudgetBreakdown(
                category=cat,
                estimated_cost=cat_subtotal,
                percentage_of_total=percentage,
                item_count=bucket_counts[cat]
            )

        warnings: List[str] = []
        if is_over:
            pct_over = float(((over_amount / planned_budget) * 100).quantize(Decimal("0.1"))) if planned_budget > 0 else 100.0
            warnings.append(
                f"Estimated trip expenses ({currency} {total_cost:,.2f}) exceed planned budget ({currency} {planned_budget:,.2f}) "
                f"by {currency} {over_amount:,.2f} (+{pct_over}%). Consider switching to free attractions or adjusting dining choices."
            )

        return BudgetSummary(
            planned_budget=planned_budget,
            total_estimated_cost=total_cost,
            currency=currency,
            remaining_budget=remaining.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            is_over_budget=is_over,
            over_budget_amount=over_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            cost_per_traveler=cost_per_traveler,
            traveler_count=travelers,
            trip_days=trip_days,
            categories=category_breakdowns,
            warnings=warnings
        )
