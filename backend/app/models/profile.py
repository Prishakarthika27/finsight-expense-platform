from pydantic import BaseModel
from typing import Optional


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    created_at: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None