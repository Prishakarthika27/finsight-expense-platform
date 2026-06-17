from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from supabase import create_client, Client
from app.config import get_settings
from app.routers.dashboard import get_user_id
from app.services.signature_service import sign_pdf, decode_base64_image
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/signature", tags=["Digital Signature"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


class SaveSignatureRequest(BaseModel):
    signature_data: str


class SaveSignatureResponse(BaseModel):
    signature_url: str


@router.post("/save", response_model=SaveSignatureResponse)
def save_signature(payload: SaveSignatureRequest, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    try:
        image_bytes = decode_base64_image(payload.signature_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature image data")

    storage_path = f"{user_id}/signature_{uuid.uuid4()}.png"

    supabase.storage.from_("signatures").upload(
        storage_path,
        image_bytes,
        {"content-type": "image/png"},
    )

    signed_url_response = supabase.storage.from_("signatures").create_signed_url(storage_path, 31536000)  # 1 year
    signature_url = signed_url_response["signedURL"]

    return SaveSignatureResponse(signature_url=signature_url)


@router.post("/sign-document")
async def sign_document(
    file: UploadFile = File(...),
    signature_data: str = Form(...),
    user_id: str = Depends(get_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files can be signed")

    pdf_bytes = await file.read()

    try:
        signature_bytes = decode_base64_image(signature_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature image data")

    try:
        signed_pdf_bytes = sign_pdf(pdf_bytes, signature_bytes)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="We couldn't sign this PDF. It may be corrupted or created with unsupported formatting. Please try a different PDF file.",
        )

    supabase = get_supabase_client()
    storage_path = f"{user_id}/signed_{uuid.uuid4()}.pdf"

    supabase.storage.from_("documents").upload(
        storage_path,
        signed_pdf_bytes,
        {"content-type": "application/pdf"},
    )

    signed_url_response = supabase.storage.from_("documents").create_signed_url(storage_path, 3600)
    download_url = signed_url_response["signedURL"]

    # Log in documents table
    supabase.table("documents").insert({
        "user_id": user_id,
        "name": file.filename or "signed_document.pdf",
        "file_url": storage_path,
        "file_type": "signed_document",
        "signed": True,
    }).execute()

    return {"download_url": download_url}