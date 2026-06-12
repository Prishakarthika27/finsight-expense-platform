from pydantic import BaseModel, Field
from datetime import date as date_type
from typing import Optional, Literal

Category = Literal["Food", "Travel", "Shopping", "Bills", "Healthcare", "Entertainment", "Other"]


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    currency: str = "INR"
    category: Category
    description: str
    date: date_type
    receipt_url: Optional[str] = None


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = None
    category: Optional[Category] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    receipt_url: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    currency: str
    category: str
    description: str
    date: date_type
    receipt_url: Optional[str] = None
    created_at: str