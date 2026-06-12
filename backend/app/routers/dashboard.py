from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import create_client, Client
from app.config import get_settings
from app.models.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_id(authorization: str = Header(...)) -> str:
    token = authorization.replace("Bearer ", "")
    supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    expenses_response = supabase.table("expenses").select("amount").eq("user_id", user_id).execute()
    total_expenses = sum(float(row["amount"]) for row in expenses_response.data)

    income_response = (
        supabase.table("transactions")
        .select("amount")
        .eq("user_id", user_id)
        .eq("type", "credit")
        .execute()
    )
    total_income = sum(float(row["amount"]) for row in income_response.data)

    documents_response = supabase.table("documents").select("id", count="exact").eq("user_id", user_id).execute()
    documents_processed = documents_response.count or 0

    statements_response = supabase.table("statements").select("id", count="exact").eq("user_id", user_id).execute()
    statements_processed = statements_response.count or 0

    bills_response = (
        supabase.table("expenses")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .not_.is_("receipt_url", "null")
        .execute()
    )
    bills_processed = bills_response.count or 0

    return DashboardStats(
        total_expenses=total_expenses,
        total_income=total_income,
        documents_processed=documents_processed,
        statements_processed=statements_processed,
        bills_processed=bills_processed,
    )