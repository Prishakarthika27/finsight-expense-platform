from pydantic import BaseModel
from typing import Optional
from datetime import date as date_type


class BillScanResult(BaseModel):
    extracted_text: str
    amount: Optional[float] = None
    merchant: Optional[str] = None
    date: Optional[date_type] = None
    category: str = "Other"


class BillScanResponse(BaseModel):
    scan_result: BillScanResult
    expense_id: Optional[str] = None