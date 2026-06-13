from pydantic import BaseModel
from typing import Optional


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    name: str
    file_url: str
    file_type: str
    signed: bool
    signature_url: Optional[str] = None
    created_at: str