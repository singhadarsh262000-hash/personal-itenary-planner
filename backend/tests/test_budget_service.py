from decimal import Decimal
from uuid import uuid4
import pytest

from app.services.budget_service import BudgetCalculationService
from app.schemas.activity import ActivityResponse
from app.schemas.common import ActivityCategory, CostBasis


def test_calculate_effective_costs():
    # per_person with 3 travelers
    cost_pp = BudgetCalculationService.calculate_effective_cost(
        base_cost=Decimal("50.00"),
        cost_basis=CostBasis.PER_PERSON,
        travelers=3,
        trip_days=5
    )
    assert cost_pp == Decimal("150.00")

    # per_night with 5 days (4 nights)
    cost_pn = BudgetCalculationService.calculate_effective_cost(
        base_cost=Decimal("120.00"),
        cost_basis=CostBasis.PER_NIGHT,
        travelers=2,
        trip_days=5
    )
    assert cost_pn == Decimal("480.00")

    # per_group flat amount
    cost_pg = BudgetCalculationService.calculate_effective_cost(
        base_cost=Decimal("80.00"),
        cost_basis=CostBasis.PER_GROUP,
        travelers=4,
        trip_days=5
    )
    assert cost_pg == Decimal("80.00")


def test_budget_summary_within_budget():
    day_id = uuid4()
    acts = [
        ActivityResponse(
            id=uuid4(),
            day_id=day_id,
            name="Hotel Stay",
            description="Boutique Hotel",
            category=ActivityCategory.ACCOMMODATION,
            start_time="15:00",
            end_time="16:00",
            estimated_duration_minutes=60,
            location_name="Downtown Hotel",
            estimated_cost=Decimal("150.00"),
            currency="USD",
            cost_basis=CostBasis.PER_NIGHT,
            sort_order=1
        ),
        ActivityResponse(
            id=uuid4(),
            day_id=day_id,
            name="Dinner Tasting",
            description="Local cuisine",
            category=ActivityCategory.DINING,
            start_time="19:00",
            end_time="21:00",
            estimated_duration_minutes=120,
            location_name="Bistro",
            estimated_cost=Decimal("40.00"),
            currency="USD",
            cost_basis=CostBasis.PER_PERSON,
            sort_order=2
        )
    ]

    # Trip: 3 days (2 nights), 2 travelers, planned budget = $600
    summary = BudgetCalculationService.calculate_budget(
        activities=acts,
        planned_budget=Decimal("600.00"),
        currency="USD",
        travelers=2,
        trip_days=3
    )

    # Hotel: 150 * 2 nights = 300
    # Dinner: 40 * 2 people = 80
    # Total = 380
    assert summary.total_estimated_cost == Decimal("380.00")
    assert summary.planned_budget == Decimal("600.00")
    assert summary.remaining_budget == Decimal("220.00")
    assert not summary.is_over_budget
    assert summary.over_budget_amount == Decimal("0.00")
    assert summary.cost_per_traveler == Decimal("190.00")
    assert summary.categories["Accommodation"].estimated_cost == Decimal("300.00")
    assert summary.categories["Food"].estimated_cost == Decimal("80.00")


def test_budget_summary_over_budget_warning():
    day_id = uuid4()
    acts = [
        ActivityResponse(
            id=uuid4(),
            day_id=day_id,
            name="Private Yacht Charter",
            description="Luxury day cruise",
            category=ActivityCategory.ACTIVITY,
            start_time="10:00",
            end_time="14:00",
            estimated_duration_minutes=240,
            location_name="Marina",
            estimated_cost=Decimal("1200.00"),
            currency="USD",
            cost_basis=CostBasis.TOTAL,
            sort_order=1
        )
    ]

    summary = BudgetCalculationService.calculate_budget(
        activities=acts,
        planned_budget=Decimal("1000.00"),
        currency="USD",
        travelers=2,
        trip_days=3
    )

    assert summary.total_estimated_cost == Decimal("1200.00")
    assert summary.is_over_budget is True
    assert summary.over_budget_amount == Decimal("200.00")
    assert len(summary.warnings) > 0
    assert "exceed planned budget" in summary.warnings[0]
