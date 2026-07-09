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


RECEIPT_EXTRACTION_SYSTEM_PROMPT = """You are an expert at reading messy, noisy OCR output from photographed receipts and recovering the correct structured data - the same way an experienced human bookkeeper would glance at a smudged, glare-heavy receipt and still figure out what it says from context.

OCR text from photographed receipts is frequently corrupted in predictable ways:
- Characters get misread (0/O, 1/I/l, 5/S, rn/m)
- Words get merged or split incorrectly
- Background clutter (table textures, shadows, fingers) can inject unrelated noise text
- Currency symbols (₹, Rs) are often misread as letters like "I" or dropped entirely
- A label and its value can end up on different lines even though they belong together

Because of this, you must NOT simply pick the first number or first line of text you see. You must reason about which numbers and words make sense in the context of a real receipt.

The input you receive may contain TWO separate OCR attempts on the same receipt, labeled "OCR ATTEMPT 1" and "OCR ATTEMPT 2" - these come from different text segmentation strategies, so one attempt may correctly capture a field (like the date or store name) that the other garbled or dropped entirely. Cross-reference both attempts and use whichever one gives you a clearer, more plausible reading for each field - you are not required to use only one attempt for everything.

RULES FOR "amount" (the final total paid):
- The correct amount is the FINAL invoice total, typically the largest monetary figure on the receipt, usually near words like "Total", "Grand Total", "Total Amount", "Net Payable", "Amount Due" - including near-misspelled versions of these words caused by OCR noise (e.g. "otal(Rs)", "GrandToal", "T0tal").
- NEVER use numbers that are actually: Cash Code, Order ID, Transaction ID, Invoice/Bill number, GSTIN, FSSAI number, phone/mobile numbers, table numbers, or item quantities. These are common false positives in noisy OCR text.
- NEVER use the "Cash" tendered amount, "Balance"/"Change" returned, or any payment-method figure as the total - these appear in a "Payment Details" section and represent how the customer paid, NOT what the bill actually cost. For example, if a receipt shows "Total Amount: 155.00" followed later by "Cash: 200.00, Balance: 45.00", the correct amount is 155.00, not 200.00 or 45.00.
- If subtotal, tax lines, and a final total are all present, use the FINAL total (largest of the group, appearing last, before any payment/cash/balance section), not the subtotal.

RULES FOR "merchant":
- Usually appears near the top of the receipt, often as a logo/brand name that OCR may have garbled badly.
- Use your general world knowledge: if the garbled text resembles a real, known business name (a restaurant chain, retailer, brand, etc.), infer and return the correct real name rather than the literal garbled OCR text. For example, if OCR produced something like "ADYAR ANANDA BHAUAN SWEET" or similarly mangled text, recognize this as the well-known Indian restaurant chain "Adyar Ananda Bhavan (A2B)" and return that, not the garbled version.
- Do NOT confuse a cashier/staff name, till number, or counter number (e.g. "Till No: VP5 / KAVIYARA") with the merchant name - the actual business name is usually a distinct, larger heading at the very top of the receipt, separate from operational details like till/counter/cashier.
- If the top-of-receipt text is too corrupted to identify ANY plausible business name (pure noise, no recognizable words), return null rather than guessing randomly.

RULES FOR "date":
- Convert to YYYY-MM-DD format.
- Watch for OCR corruption of month names/numbers and reconstruct the most plausible real date.
- IMPORTANT: if the day-of-month appears to start with an unusual symbol immediately before a single digit (e.g. "{7", "l7", "I7", "i7", "(7"), this is almost always OCR misreading the digit "1" - treat it as a two-digit day (e.g. "{7" most likely means "17"), not a single-digit day formed by dropping the stray symbol.
- If one OCR attempt shows a clear, plausible date (e.g. numeric DD/MM/YYYY format) and the other shows only garbled fragments near where a date should be, prefer the clear one.
- If genuinely no date-like pattern exists in EITHER OCR attempt, return null rather than guessing an arbitrary date.

Respond with ONLY valid JSON, nothing else, in this exact shape:
{"amount": <number or null>, "merchant": "<string or null>", "date": "<YYYY-MM-DD or null>"}"""


RECEIPT_EXTRACTION_EXAMPLE_INPUT = """SPARKLE MART SUPERMARKE T
GSTIN: 29ABCOE1Z234 FSSAI NO: 1029384
TAX INVOT!
Bill No: SM88213/442
Date: 03/Peb/2025 18:22
1tem Qty Rate Anount
MILK 1L 2 60.00 120.00
BREAD LOAF 1 45.00 45.00
EGGS DOZEN 1 90.00 90.00
Subtotal: 255.00
CGST 2.5%: 6.38
SGST 2.5%: 6.38
Grend Totol (Rs) 268.00
Cash Code: CM-7712 Txn Id: PAY9988271"""

RECEIPT_EXTRACTION_EXAMPLE_OUTPUT = """{"amount": 268.00, "merchant": "Sparkle Mart Supermarket", "date": "2025-02-03"}"""


def extract_receipt_data(extracted_text: str) -> dict:
    """
    Uses Groq to extract amount, merchant, and date directly from raw OCR text,
    instead of relying on regex patterns that break across different receipt
    formats. A detailed system prompt plus a worked few-shot example teaches
    the model to reason through common OCR noise patterns (false-positive
    reference codes, garbled brand names, split label/value lines) rather
    than naively grabbing the first number or line it sees.

    Returns a dict with keys: amount (float or None), merchant (str or None),
    date (str in YYYY-MM-DD format, or None).
    """
    fallback = {"amount": None, "merchant": None, "date": None}

    if not extracted_text or not extracted_text.strip():
        return fallback

    try:
        client = Groq(api_key=settings.groq_api_key)

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": RECEIPT_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": RECEIPT_EXTRACTION_EXAMPLE_INPUT},
                {"role": "assistant", "content": RECEIPT_EXTRACTION_EXAMPLE_OUTPUT},
                {"role": "user", "content": extracted_text[:3500]},
            ],
            max_tokens=200,
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