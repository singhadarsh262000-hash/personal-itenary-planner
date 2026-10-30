from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import CurrencyAmount


class CategoryBudgetBreakdown(BaseModel):
    category: str
    estimated_cost: CurrencyAmount = Field(default=Decimal("0.00"), ge=0)
    percentage_of_total: float = Field(default=0.0, ge=0.0, le=100.0)
    item_count: int = Field(default=0, ge=0)


class BudgetSummary(BaseModel):
    planned_budget: CurrencyAmount = Field(..., ge=0, description="User's planned budget limit")
    total_estimated_cost: CurrencyAmount = Field(..., ge=0, description="Authoritative sum of all estimated expenses")
    currency: str = Field(default="USD", min_length=3, max_length=5)
    remaining_budget: CurrencyAmount = Field(default=Decimal("0.00"), description="Planned budget minus total estimated cost")
    is_over_budget: bool = Field(default=False)
    over_budget_amount: CurrencyAmount = Field(default=Decimal("0.00"), ge=0)
    cost_per_traveler: CurrencyAmount = Field(default=Decimal("0.00"), ge=0)
    traveler_count: int = Field(..., ge=1)
    trip_days: int = Field(..., ge=1)
    categories: Dict[str, CategoryBudgetBreakdown] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="All budget numbers are estimates and suggestions based on market averages. Actual prices, taxes, and fees may vary.",
        description="Clear estimate disclaimer"
    )

    model_config = {"from_attributes": True}
