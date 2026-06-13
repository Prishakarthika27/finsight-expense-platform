from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import create_client, Client
from app.config import get_settings
from app.models.statement import StatementAnalysisResponse, TransactionItem, StatementInsights
from app.routers.dashboard import get_user_id
from app.services.statement_service import (
    extract_text_from_pdf,
    parse_transactions,
    calculate_insights,
    PasswordProtectedError,
    CorruptedPDFError,
    ScannedPDFError,
    NoTransactionsError,
)
import uuid

router = APIRouter(prefix="/statements", tags=["Bank Statements"])

settings = get_settings()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/analyze", response_model=StatementAnalysisResponse)
async def analyze_statement(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted for bank statements")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    try:
        text = extract_text_from_pdf(file_bytes)
        transactions = parse_transactions(text)
    except PasswordProtectedError:
        raise HTTPException(status_code=400, detail="This PDF is password protected. Please upload an unlocked version")
    except ScannedPDFError:
        raise HTTPException(
            status_code=400,
            detail="This appears to be a scanned PDF. For best results please download your statement directly from your bank's internet banking portal",
        )
    except NoTransactionsError:
        raise HTTPException(
            status_code=400,
            detail="Could not extract transactions from this PDF. Please upload a valid bank statement downloaded from your bank's internet banking portal",
        )
    except CorruptedPDFError:
        raise HTTPException(status_code=400, detail="Could not read this PDF. Please try again with a different file")

    insights = calculate_insights(transactions)

    supabase = get_supabase_client()

    # Upload to private storage bucket
    storage_path = f"{user_id}/{uuid.uuid4()}.pdf"
    supabase.storage.from_("statements").upload(
        storage_path,
        file_bytes,
        {"content-type": "application/pdf"},
    )

    # Create statement record
    statement_dates = [t[0] for t in transactions]
    statement_response = supabase.table("statements").insert({
        "user_id": user_id,
        "file_url": storage_path,
        "bank_name": "Unknown",
        "period_start": min(statement_dates).isoformat(),
        "period_end": max(statement_dates).isoformat(),
        "status": "completed",
    }).execute()

    statement_id = statement_response.data[0]["id"]

    # Insert transactions
    transaction_rows = [
        {
            "statement_id": statement_id,
            "user_id": user_id,
            "date": t[0].isoformat(),
            "description": t[1],
            "amount": t[2],
            "type": t[3],
            "category": t[4],
        }
        for t in transactions
    ]
    supabase.table("transactions").insert(transaction_rows).execute()

    # Log in documents table
    supabase.table("documents").insert({
        "user_id": user_id,
        "name": file.filename or "statement.pdf",
        "file_url": storage_path,
        "file_type": "statement",
        "signed": False,
    }).execute()

    return StatementAnalysisResponse(
        statement_id=statement_id,
        transactions=[
            TransactionItem(date=t[0], description=t[1], amount=t[2], type=t[3], category=t[4])
            for t in transactions
        ],
        insights=StatementInsights(**insights),
    )