from pydantic import BaseModel
from typing import List, Optional
from datetime import date as date_type


class TransactionItem(BaseModel):
    date: date_type
    description: str
    amount: float
    type: str  # "credit" or "debit"
    category: str


class StatementInsights(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    top_category: Optional[str] = None


class StatementAnalysisResponse(BaseModel):
    statement_id: str
    transactions: List[TransactionItem]
    insights: StatementInsights