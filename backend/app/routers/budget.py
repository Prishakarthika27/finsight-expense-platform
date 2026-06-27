from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from app.config import get_settings
from app.routers.dashboard import get_user_id

router = APIRouter(prefix="/budget", tags=["Budget"])
settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


class BudgetUpdate(BaseModel):
    monthly_budget: float


@router.get("")
def get_budget(user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()
    response = supabase.table("budgets").select("*").eq("user_id", user_id).execute()
    if not response.data:
        return {"monthly_budget": 0}
    return response.data[0]


@router.post("")
def set_budget(
    payload: BudgetUpdate,
    user_id: str = Depends(get_user_id),
):
    supabase = get_supabase_client()

    existing = supabase.table("budgets").select("id").eq("user_id", user_id).execute()

    if existing.data:
        response = supabase.table("budgets").update({
            "monthly_budget": payload.monthly_budget,
            "updated_at": "now()"
        }).eq("user_id", user_id).execute()
    else:
        response = supabase.table("budgets").insert({
            "user_id": user_id,
            "monthly_budget": payload.monthly_budget,
        }).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to save budget")

    return response.data[0]