from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, Depends
from supabase import create_client, Client
from app.config import get_settings
from app.models.charts import ChartsData, MonthlySpendingItem, CategorySpendingItem, IncomeVsExpenseItem
from app.routers.dashboard import get_user_id

router = APIRouter(prefix="/charts", tags=["Charts"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


@router.get("/data", response_model=ChartsData)
def get_charts_data(user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    # Monthly spending (last 6 months) from expenses
    expenses_response = (
        supabase.table("expenses")
        .select("amount, date, category")
        .eq("user_id", user_id)
        .execute()
    )

    monthly_totals: dict[str, float] = defaultdict(float)
    category_totals: dict[str, float] = defaultdict(float)

    for row in expenses_response.data:
        date_obj = datetime.strptime(row["date"], "%Y-%m-%d")
        month_key = f"{MONTH_NAMES[date_obj.month - 1]} {date_obj.year}"
        monthly_totals[month_key] += float(row["amount"])
        category_totals[row["category"]] += float(row["amount"])

    monthly_spending = [
        MonthlySpendingItem(month=month, amount=round(amount, 2))
        for month, amount in sorted(monthly_totals.items(), key=lambda x: datetime.strptime(x[0], "%b %Y"))
    ][-6:]

    category_distribution = [
        CategorySpendingItem(category=category, amount=round(amount, 2))
        for category, amount in category_totals.items()
    ]

    # Income vs Expense (last 6 months) from transactions
    transactions_response = (
        supabase.table("transactions")
        .select("amount, date, type")
        .eq("user_id", user_id)
        .execute()
    )

    income_expense_totals: dict[str, dict[str, float]] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for row in transactions_response.data:
        date_obj = datetime.strptime(row["date"], "%Y-%m-%d")
        month_key = f"{MONTH_NAMES[date_obj.month - 1]} {date_obj.year}"
        if row["type"] == "credit":
            income_expense_totals[month_key]["income"] += float(row["amount"])
        else:
            income_expense_totals[month_key]["expense"] += float(row["amount"])

    income_vs_expense = [
        IncomeVsExpenseItem(month=month, income=round(values["income"], 2), expense=round(values["expense"], 2))
        for month, values in sorted(income_expense_totals.items(), key=lambda x: datetime.strptime(x[0], "%b %Y"))
    ][-6:]

    return ChartsData(
        monthly_spending=monthly_spending,
        category_distribution=category_distribution,
        income_vs_expense=income_vs_expense,
    )