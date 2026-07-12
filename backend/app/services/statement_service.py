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

CREDIT_KEYWORDS = [" cr", "credit", "deposit", "salary", "refund", "interest", "received"]
DEBIT_KEYWORDS = ["debit", "dr", "withdrawal", "payment", "purchase", "charge"]

CATEGORY_KEYWORDS = {
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "eat"],
    "Travel": ["uber", "ola", "irctc", "flight", "fuel", "petrol", "fare", "metro", "rapido"],
    "Shopping": ["amazon", "flipkart", "myntra", "mall", "store", "shopping", "retail", "big bazaar"],
    "Bills": ["electricity", "recharge", "broadband", "bill payment", "dth", "insurance", "premium", "bescom", "water bill"],
    "Healthcare": ["pharmacy", "hospital", "medical", "clinic", "health", "apollo"],
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

    if len(full_text.strip()) < 50:
        raise ScannedPDFError()

    return full_text


def parse_date(date_str: str) -> Optional[date_type]:
    date_str = date_str.strip()

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

    match = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", date_str)
    if match:
        year, month, day = match.groups()
        try:
            return date_type(int(year), int(month), int(day))
        except ValueError:
            return None

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

    try:
        from app.services.ai_service import classify_transaction_category
        return classify_transaction_category(description)
    except Exception:
        return "Other"


def _parse_transactions_single_line(text: str) -> List[Tuple[date_type, str, float, str, str]]:
    """
    Handles bank statement PDFs where each full transaction (date, description,
    amount) extracts onto a single line. Returns an empty list (rather than
    raising) if nothing matches, so the caller can fall back to the next parser.
    """
    transactions = []
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line or len(line) < 8:
            continue

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

        amounts = re.findall(r"[\d,]+\.\d{2}", line)
        if not amounts:
            continue

        try:
            amount = float(amounts[-1].replace(",", ""))
        except ValueError:
            continue

        if amount <= 0:
            continue

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

        description = line
        description = description.replace(date_match.group(0), "")
        for amt in amounts:
            description = description.replace(amt, "")
        description = re.sub(r"[\d,]+\.\d{2}", "", description)
        description = re.sub(r"\b(CR|DR)\b\s*$", "", description, flags=re.IGNORECASE)
        description = re.sub(r"\s{2,}", " ", description).strip(" -|,")
        description = description[:100] if description else "Transaction"

        category = detect_category(description)

        transactions.append((date_obj, description, amount, txn_type, category))

    return transactions


def _extract_statement_year(text: str) -> int:
    """
    Multi-line table statements often show day+month per row without a year
    (e.g. "01 Jun"), relying on the statement header for the year. This pulls
    the first 4-digit year mentioned anywhere in the document as a default.
    """
    match = re.search(r"\b(20\d{2})\b", text)
    if match:
        return int(match.group(1))
    return datetime.now().year


def _parse_transactions_multiline(text: str, default_year: int) -> List[Tuple[date_type, str, float, str, str]]:
    """
    Handles bank statement PDFs where a table's columns extract as separate
    lines instead of one line per transaction - e.g. HDFC-style statements
    where "01 Jun", "Salary Credit - TCS Ltd", "Credit", "75,000.00",
    "1,20,230.00" each land on their own line.
    """
    lines = [l.strip() for l in text.split("\n")]
    n = len(lines)
    transactions = []

    date_pattern = re.compile(
        r"^(\d{1,2})[\s\-]([A-Za-z]{3})[a-z]*\.?(?:[\s\-](\d{2,4}))?$", re.IGNORECASE
    )
    type_pattern = re.compile(r"^(credit|debit)$", re.IGNORECASE)
    amount_pattern = re.compile(r"^[\d,]+\.\d{2}$")

    i = 0
    while i < n:
        line = lines[i]
        m = date_pattern.match(line) if line else None
        if not m:
            i += 1
            continue

        day = int(m.group(1))
        month = MONTH_MAP.get(m.group(2).lower())
        year_str = m.group(3)
        year = int(year_str) if year_str else default_year
        if year < 100:
            year += 2000

        if not month:
            i += 1
            continue

        try:
            txn_date = date_type(year, month, day)
        except ValueError:
            i += 1
            continue

        desc_parts = []
        j = i + 1
        found_type = None
        lookahead_limit = min(i + 7, n)
        while j < lookahead_limit:
            candidate = lines[j]
            if not candidate:
                j += 1
                continue
            if type_pattern.match(candidate):
                found_type = candidate.lower()
                break
            if date_pattern.match(candidate):
                break
            desc_parts.append(candidate)
            j += 1

        if not found_type:
            i += 1
            continue

        k = j + 1
        amount_val = None
        while k < min(j + 4, n):
            candidate = lines[k]
            if not candidate:
                k += 1
                continue
            if amount_pattern.match(candidate):
                amount_val = candidate
                k += 1
            break

        if amount_val is None:
            i = j + 1
            continue

        if k < n and lines[k] and amount_pattern.match(lines[k]):
            k += 1

        try:
            amount = float(amount_val.replace(",", ""))
        except ValueError:
            i = k
            continue

        if amount <= 0:
            i = k
            continue

        description = " ".join(desc_parts).strip() or "Transaction"
        txn_type = "credit" if found_type == "credit" else "debit"
        category = detect_category(description)

        transactions.append((txn_date, description, amount, txn_type, category))
        i = k

    return transactions


def _parse_transactions_split_columns(text: str, default_year: int) -> List[Tuple[date_type, str, float, str, str]]:
    """
    Handles bank statement PDFs with separate Withdrawal and Deposit columns
    instead of one combined Amount+Type column - common in ICICI/SBI/Axis-style
    statements. Each field still lands on its own line (date, particulars,
    ref no, withdrawal-or-dash, deposit-or-dash, balance). A "-" placeholder
    marks the empty column; whichever of withdrawal/deposit has a real value
    determines both the amount and the transaction type.
    """
    lines = [l.strip() for l in text.split("\n")]
    n = len(lines)
    transactions = []

    date_pattern = re.compile(r"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$")
    amount_or_dash_pattern = re.compile(r"^([\d,]+\.\d{2}|-)$")

    i = 0
    while i < n:
        line = lines[i]
        m = date_pattern.match(line) if line else None
        if not m:
            i += 1
            continue

        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if year < 100:
            year += 2000
        if year < 100 or year > 3000 or not (1 <= month <= 12):
            i += 1
            continue
        try:
            txn_date = date_type(year, month, day)
        except ValueError:
            i += 1
            continue

        desc_parts = []
        j = i + 1
        lookahead_limit = min(i + 8, n)
        while j < lookahead_limit:
            candidate = lines[j]
            if not candidate:
                j += 1
                continue
            if amount_or_dash_pattern.match(candidate):
                break
            if date_pattern.match(candidate):
                break
            desc_parts.append(candidate)
            j += 1

        if j >= lookahead_limit or not lines[j] or not amount_or_dash_pattern.match(lines[j]):
            i += 1
            continue

        withdrawal_tok = lines[j]
        j += 1

        while j < n and not lines[j]:
            j += 1
        if j >= n or not amount_or_dash_pattern.match(lines[j] or ""):
            i = j
            continue
        deposit_tok = lines[j]
        j += 1

        while j < n and not lines[j]:
            j += 1
        if j < n and amount_or_dash_pattern.match(lines[j] or ""):
            j += 1

        if withdrawal_tok != "-":
            amount_str, txn_type = withdrawal_tok, "debit"
        elif deposit_tok != "-":
            amount_str, txn_type = deposit_tok, "credit"
        else:
            i = j
            continue

        try:
            amount = float(amount_str.replace(",", ""))
        except ValueError:
            i = j
            continue

        if amount <= 0:
            i = j
            continue

        description = " ".join(desc_parts).strip() or "Transaction"
        category = detect_category(description)

        transactions.append((txn_date, description, amount, txn_type, category))
        i = j

    return transactions


def _parse_ai_transactions(text: str) -> List[Tuple[date_type, str, float, str, str]]:
    """
    Calls the Groq-based extractor and converts its dict output into the
    same tuple shape the regex parsers produce. Only used as a last-resort
    catch-all if none of the regex parsers above find anything - Groq proved
    unreliable on per-row date convention (DD-MM vs MM-DD) and credit/debit
    inference when tested against a real multi-row statement.
    """
    try:
        from app.services.ai_service import extract_bank_transactions
    except Exception:
        return []

    raw_results = extract_bank_transactions(text)
    transactions = []

    for item in raw_results:
        try:
            txn_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
        except (ValueError, KeyError):
            continue

        transactions.append((
            txn_date,
            item["description"],
            item["amount"],
            item["type"],
            item["category"],
        ))

    return transactions


def parse_transactions(text: str) -> List[Tuple[date_type, str, float, str, str]]:
    """Returns list of (date, description, amount, type, category)"""
    # Regex parsers run first - they've been directly tested and verified
    # correct against real statement layouts. Groq's per-row date convention
    # (DD-MM vs MM-DD) and credit/debit inference proved unreliable on
    # multi-row extraction, so it's kept only as a last-resort catch-all
    # for a genuinely new, uncovered format - not as the primary path.
    transactions = _parse_transactions_single_line(text)

    if not transactions:
        default_year = _extract_statement_year(text)
        transactions = _parse_transactions_multiline(text, default_year)

    if not transactions:
        default_year = _extract_statement_year(text)
        transactions = _parse_transactions_split_columns(text, default_year)

    if not transactions:
        transactions = _parse_ai_transactions(text)

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