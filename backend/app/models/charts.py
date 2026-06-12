from pydantic import BaseModel
from typing import List


class MonthlySpendingItem(BaseModel):
    month: str
    amount: float


class CategorySpendingItem(BaseModel):
    category: str
    amount: float


class IncomeVsExpenseItem(BaseModel):
    month: str
    income: float
    expense: float


class ChartsData(BaseModel):
    monthly_spending: List[MonthlySpendingItem]
    category_distribution: List[CategorySpendingItem]
    income_vs_expense: List[IncomeVsExpenseItem]