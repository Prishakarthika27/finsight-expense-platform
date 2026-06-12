from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_expenses: float
    total_income: float
    documents_processed: int
    statements_processed: int
    bills_processed: int