import re
import fitz  # PyMuPDF
from datetime import datetime, date as date_type
from typing import List, Tuple, Optional


class PasswordProtectedError(Exception):
    pass


class CorruptedPDFError(Exception):
    pass


class ScannedPDFError(Exception):
    pass


class NoTransactionsError(Exception):
    pass


# Matches dates like 01/04/2024, 01-04-2024, 01 Apr 2024, 2024-04-01
DATE_PATTERNS = [
    r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b",
    r"\b(\d{1,2})[ \-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ \-](\d{2,4})\b",
    r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b",
]

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

# Words indicating a credit (income) transaction
CREDIT_KEYWORDS = [" cr", "credit", "deposit", "salary", "refund", "interest", "received"]
# Words indicating a debit (expense) transaction
DEBIT_KEYWORDS = ["debit", "dr", "withdrawal", "payment", "purchase", "charge"]

CATEGORY_KEYWORDS = {
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "eat"],
    "Travel": ["uber", "ola", "irctc", "flight", "fuel", "petrol", "fare", "metro", "rapido"],
    "Shopping": ["amazon", "flipkart", "myntra", "mall", "store", "shopping", "retail"],
    "Bills": ["electricity", "recharge", "broadband", "bill payment", "dth", "insurance", "premium"],
    "Healthcare": ["pharmacy", "hospital", "medical", "clinic", "health"],
    "Entertainment": ["netflix", "spotify", "prime", "movie", "cinema", "subscription"],
}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        if "password" in str(e).lower() or "encrypted" in str(e).lower():
            raise PasswordProtectedError()
        raise CorruptedPDFError()

    if pdf_document.needs_pass:
        pdf_document.close()
        raise PasswordProtectedError()

    full_text = ""
    for page in pdf_document:
        full_text += page.get_text()

    pdf_document.close()

    # If almost no text extracted, it's likely a scanned PDF
    if len(full_text.strip()) < 50:
        raise ScannedPDFError()

    return full_text


def parse_date(date_str: str) -> Optional[date_type]:
    date_str = date_str.strip()

    # Try DD/MM/YYYY or DD-MM-YYYY
    match = re.match(r"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$", date_str)
    if match:
        day, month, year = match.groups()
        year = int(year)
        if year < 100:
            year += 2000
        try:
            return date_type(year, int(month), int(day))
        except ValueError:
            return None

    # Try YYYY-MM-DD
    match = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", date_str)
    if match:
        year, month, day = match.groups()
        try:
            return date_type(int(year), int(month), int(day))
        except ValueError:
            return None

    # Try DD Mon YYYY
    match = re.match(r"^(\d{1,2})[ \-]([A-Za-z]{3})[a-z]*[ \-](\d{2,4})$", date_str)
    if match:
        day, mon, year = match.groups()
        mon_num = MONTH_MAP.get(mon.lower())
        if mon_num:
            year = int(year)
            if year < 100:
                year += 2000
            try:
                return date_type(year, mon_num, int(day))
            except ValueError:
                return None

    return None


def detect_category(description: str) -> str:
    desc_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return category

    # Fallback to AI classification for unmatched descriptions
    try:
        from app.services.ai_service import classify_transaction_category
        return classify_transaction_category(description)
    except Exception:
        return "Other"


def parse_transactions(text: str) -> List[Tuple[date_type, str, float, str, str]]:
    """Returns list of (date, description, amount, type, category)"""
    transactions = []
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line or len(line) < 8:
            continue

        # Find a date at the start of the line
        date_match = None
        date_obj = None
        for pattern in DATE_PATTERNS:
            m = re.search(pattern, line)
            if m:
                date_obj = parse_date(m.group(0))
                if date_obj:
                    date_match = m
                    break

        if not date_obj:
            continue

        # Find amounts in the line (numbers with optional commas/decimals)
        amounts = re.findall(r"[\d,]+\.\d{2}", line)
        if not amounts:
            continue

        try:
            amount = float(amounts[-1].replace(",", ""))
        except ValueError:
            continue

        if amount <= 0:
            continue

        # Determine description: text between date and first amount
        line_lower = line.lower()
        txn_type = "debit"
        for kw in CREDIT_KEYWORDS:
            if kw in line_lower:
                txn_type = "credit"
                break
        if txn_type == "debit":
            for kw in DEBIT_KEYWORDS:
                if kw in line_lower:
                    txn_type = "debit"
                    break

        # Extract description - remove date and numbers
        description = line
        description = description.replace(date_match.group(0), "")
        for amt in amounts:
            description = description.replace(amt, "")
        description = re.sub(r"[\d,]+\.\d{2}", "", description)
        description = re.sub(r"\s{2,}", " ", description).strip(" -|,")
        description = description[:100] if description else "Transaction"

        category = detect_category(description)

        transactions.append((date_obj, description, amount, txn_type, category))

    if not transactions:
        raise NoTransactionsError()

    return transactions


def calculate_insights(transactions: List[Tuple[date_type, str, float, str, str]]) -> dict:
    total_income = sum(t[2] for t in transactions if t[3] == "credit")
    total_expense = sum(t[2] for t in transactions if t[3] == "debit")
    net_savings = total_income - total_expense

    category_totals: dict[str, float] = {}
    for t in transactions:
        if t[3] == "debit":
            category_totals[t[4]] = category_totals.get(t[4], 0) + t[2]

    top_category = max(category_totals, key=category_totals.get) if category_totals else None

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "top_category": top_category,
    }