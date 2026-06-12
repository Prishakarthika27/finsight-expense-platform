from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import create_client, Client
from app.config import get_settings
from app.models.bill import BillScanResponse, BillScanResult
from app.routers.dashboard import get_user_id
from app.services.ocr_service import process_receipt_file
import uuid

router = APIRouter(prefix="/bills", tags=["Bill Scanner"])

settings = get_settings()

ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/scan", response_model=BillScanResponse)
async def scan_bill(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.",
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Run OCR
    text, amount, merchant, extracted_date, category = process_receipt_file(file_bytes, file.content_type)

    # Upload to Supabase Storage
    supabase = get_supabase_client()
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    storage_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"

    supabase.storage.from_("receipts").upload(
        storage_path,
        file_bytes,
        {"content-type": file.content_type},
    )

    receipt_url = supabase.storage.from_("receipts").get_public_url(storage_path)

    scan_result = BillScanResult(
        extracted_text=text[:1000],  # limit text length
        amount=amount,
        merchant=merchant,
        date=extracted_date,
        category=category,
    )

    expense_id = None

    # Auto-create expense if amount was detected
    if amount is not None:
        expense_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": "INR",
            "category": category,
            "description": merchant or "Scanned Bill",
            "date": extracted_date.isoformat() if extracted_date else None,
            "receipt_url": receipt_url,
        }

        if expense_data["date"] is None:
            from datetime import date
            expense_data["date"] = date.today().isoformat()

        response = supabase.table("expenses").insert(expense_data).execute()
        if response.data:
            expense_id = response.data[0]["id"]

    # Increment bills processed - track via documents table
    supabase.table("documents").insert({
        "user_id": user_id,
        "name": file.filename or "receipt",
        "file_url": receipt_url,
        "file_type": "bill",
        "signed": False,
    }).execute()

    return BillScanResponse(scan_result=scan_result, expense_id=expense_id)