import json
from groq import Groq
from app.config import get_settings

settings = get_settings()

VALID_CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Healthcare", "Entertainment", "Other"]


def classify_category(extracted_text: str, merchant: str | None) -> str:
    try:
        client = Groq(api_key=settings.groq_api_key)

        prompt = f"""You are a receipt categorization assistant. Based on the merchant name and receipt text below, classify it into EXACTLY ONE of these categories: Food, Travel, Shopping, Bills, Healthcare, Entertainment, Other.

Merchant: {merchant or "Unknown"}
Receipt text snippet: {extracted_text[:300]}

Respond with ONLY the category name, nothing else."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0,
        )

        category = response.choices[0].message.content.strip()

        for valid in VALID_CATEGORIES:
            if valid.lower() == category.lower():
                return valid

        return "Other"
    except Exception:
        return "Other"


def classify_transaction_category(description: str) -> str:
    try:
        client = Groq(api_key=settings.groq_api_key)

        prompt = f"""Classify this bank transaction description into EXACTLY ONE category: Food, Travel, Shopping, Bills, Healthcare, Entertainment, Other.

Transaction description: {description}

Respond with ONLY the category name, nothing else."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0,
        )

        category = response.choices[0].message.content.strip()

        for valid in VALID_CATEGORIES:
            if valid.lower() == category.lower():
                return valid

        return "Other"
    except Exception:
        return "Other"


def extract_receipt_data(extracted_text: str) -> dict:
    """
    Uses Groq to extract amount, merchant, and date directly from raw OCR text,
    instead of relying on regex patterns that break across different receipt
    formats. Returns a dict with keys: amount (float or None), merchant
    (str or None), date (str in YYYY-MM-DD format, or None).
    """
    fallback = {"amount": None, "merchant": None, "date": None}

    if not extracted_text or not extracted_text.strip():
        return fallback

    try:
        client = Groq(api_key=settings.groq_api_key)

        prompt = f"""You are a receipt data extraction assistant. The text below was extracted via OCR from a photographed or scanned receipt, so it may contain typos, misread characters, or garbled formatting.

Extract exactly these three fields:
- amount: the FINAL total amount paid (usually the largest total after any subtotal/tax lines, often labeled "Total", "Grand Total", "Net Payable", "Amount Due", etc). Return as a plain number with no currency symbol, no commas.
- merchant: the name of the shop/restaurant/business, ignoring generic descriptors like "Tax Invoice" or "Bill No".
- date: the transaction date, converted to YYYY-MM-DD format. If the year is ambiguous or missing, make your best reasonable guess.

If a field cannot be confidently determined, use null for that field.

Receipt text:
{extracted_text[:1500]}

Respond with ONLY valid JSON in this exact shape, nothing else:
{{"amount": <number or null>, "merchant": "<string or null>", "date": "<YYYY-MM-DD or null>"}}"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0,
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        parsed = json.loads(raw)

        amount = parsed.get("amount")
        if amount is not None:
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                amount = None

        merchant = parsed.get("merchant")
        if merchant is not None and not str(merchant).strip():
            merchant = None

        date_str = parsed.get("date")
        if date_str is not None and not str(date_str).strip():
            date_str = None

        return {"amount": amount, "merchant": merchant, "date": date_str}

    except Exception:
        return fallback