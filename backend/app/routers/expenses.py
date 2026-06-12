from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from app.config import get_settings
from app.models.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.routers.dashboard import get_user_id
from typing import List

router = APIRouter(prefix="/expenses", tags=["Expenses"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()
    response = (
        supabase.table("expenses")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    return response.data


@router.post("", response_model=ExpenseResponse)
def create_expense(payload: ExpenseCreate, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()
    data = payload.model_dump(mode="json")
    data["user_id"] = user_id

    response = supabase.table("expenses").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create expense")

    return response.data[0]


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: str, payload: ExpenseUpdate, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    existing = (
        supabase.table("expenses")
        .select("id")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = payload.model_dump(mode="json", exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = (
        supabase.table("expenses")
        .update(update_data)
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0]


@router.delete("/{expense_id}")
def delete_expense(expense_id: str, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    existing = (
        supabase.table("expenses")
        .select("id")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")

    supabase.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()
    return {"message": "Expense deleted successfully"}