from pydantic import BaseModel
from typing import Optional


class SignatureUpload(BaseModel):
    signature_data: str  # base64 PNG data


class SignDocumentRequest(BaseModel):
    document_id: str
    signature_url: str
    position_x: Optional[float] = 50
    position_y: Optional[float] = 50