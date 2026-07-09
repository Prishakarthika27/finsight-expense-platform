import pytesseract
from app.config import get_settings

_settings = get_settings()
pytesseract.pytesseract.tesseract_cmd = _settings.tesseract_cmd
import fitz  # PyMuPDF
import re
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from datetime import date as date_type, datetime
from typing import Optional, Tuple
import io


# Common date patterns found on receipts (used only as a fallback if Groq extraction fails)
DATE_PATTERNS = [
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", "%d/%m/%Y"),
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})", "%d/%m/%y"),
    (r"(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})", "%Y/%m/%d"),
    (r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})", "%d %B %Y"),
]

# Keywords that often precede the total amount (fallback only)
AMOUNT_KEYWORDS = [
    "net to pay", "net payable", "amount payable", "balance due",
    "amount due", "total due", "net amount", "grand total", "total amount", "total"
]

CATEGORY_KEYWORDS = {
    "Food": [
        "restaurant", "cafe", "food", "pizza", "burger", "kitchen", "diner", "bakery",
        "dish", "menu", "factory", "waiter", "table", "tandoori", "platter", "biryani",
        "dosa", "thali", "hotel", "bar", "grill", "snacks", "sweets", "bhavan", "dhaba",
        "juice", "ice cream", "coffee", "tea", "bistro", "eatery", "lounge", "buffet",
        "qty", "order", "kot", "veg", "non veg", "paneer", "curry", "roti", "naan",
        "soup", "salad", "dessert", "beverage", "cooldrink", "mocktail", "starter",
        "mcdonald", "kfc", "starbucks", "domino", "pizza hut", "subway", "burger king",
        "taco bell", "wendy", "chipotle", "dunkin", "baskin robbins", "krispy kreme",
        "doordash", "ubereats", "uber eats", "grubhub", "deliveroo", "just eat",
        "zomato", "swiggy", "foodpanda", "patisserie", "brewery", "pub", "tavern",
        "bbq", "barbecue", "sushi", "ramen", "noodle", "catering", "food truck",
        "canteen", "mess", "dine in", "takeaway", "take-out", "take out", "brunch",
        "bakehouse", "confectionery", "deli", "delicatessen"
    ],
    "Travel": [
        "uber", "ola", "taxi", "fuel", "petrol", "diesel", "airlines", "railway", "metro",
        "cab", "auto", "rapido", "indigo", "irctc", "bus", "ticket", "toll", "parking",
        "rental car", "flight", "station", "platform", "fare", "km", "mileage",
        "delta", "united airlines", "american airlines", "emirates", "qatar airways",
        "lufthansa", "british airways", "air france", "klm", "singapore airlines",
        "ryanair", "easyjet", "spirit airlines", "southwest airlines", "jetblue",
        "lyft", "grab", "bolt", "didi", "careem", "subway", "tube", "bart", "amtrak",
        "eurostar", "hotel", "motel", "airbnb", "booking.com", "expedia", "hostel",
        "resort", "hertz", "avis", "enterprise rent", "zipcar", "gas station",
        "petrol pump", "petrol bunk", "shell", "chevron", "exxon", "esso", " bp ",
        "trip", "makemytrip", "goibibo", "yatra", "skyscanner", "car wash"
    ],
    "Shopping": [
        "mart", "store", "shop", "mall", "retail", "supermarket", "fashion", "apparel",
        "clothing", "footwear", "electronics", "outlet", "boutique", "lifestyle",
        "reliance", "dmart", "big bazaar", "myntra", "amazon", "flipkart", "decathlon",
        "jewellery", "cosmetics", "stationery", "gift",
        "walmart", "target", "costco", "kroger", "tesco", "asda", "sainsbury", "aldi",
        "lidl", "ikea", "zara", "h&m", "uniqlo", "nike", "adidas", "best buy",
        "apple store", "ebay", "etsy", "alibaba", "shein", "temu", "sephora", "ulta",
        "home depot", "lowe's", "lowes", "department store", "thrift store",
        "convenience store", "7-eleven", "hypermarket", "showroom", "furniture store"
    ],
    "Bills": [
        "electricity", "water bill", "gas bill", "broadband", "internet", "mobile recharge",
        "postpaid", "prepaid", "wifi", "dth", "utility", "bescom", "bses", "airtel",
        "jio", "vodafone", "vi ", "tata power", "maintenance", "society", "rent receipt",
        "gas cylinder", "cylinder", "lpg", "refill", "indane", "bharat gas", "hp gas",
        "gas agency", "gas service", "gas distributor",
        "insurance", "premium", "mortgage", "rent", "lease", "verizon", "at&t",
        "t-mobile", "sprint", "o2", "ee mobile", "orange mobile", "telstra",
        "comcast", "xfinity", "spectrum", "sewer", "council tax", "property tax",
        "hoa fee", "bank fee", "loan payment", "credit card payment", "emi",
        "home insurance", "car insurance", "life insurance", "electric bill",
        "water utility", "sanitation", "waste management", "cable bill"
    ],
    "Healthcare": [
        "pharmacy", "hospital", "clinic", "medical", "medicine", "doctor", "diagnostic",
        "lab", "test report", "tablet", "syrup", "prescription", "chemist", "apollo",
        "consultation", "x-ray", "scan", "dental", "physio", "ayurveda",
        "cvs", "walgreens", "boots", "rite aid", "dentist", "optometrist", "optician",
        "veterinary", "vet clinic", "therapy", "counseling", "mental health",
        "urgent care", "emergency room", "er visit", "ambulance", "copay",
        "physiotherapy", "chiropractor", "surgery", "vaccination", "immunization"
    ],
    "Entertainment": [
        "cinema", "movie", "theatre", "netflix", "spotify", "game", "pvr", "inox",
        "amusement", "park", "concert", "show", "bowling", "arcade", "club",
        "subscription", "prime video", "hotstar", "ott",
        "disney+", "disney plus", "hulu", "hbo max", "paramount+", "apple tv",
        "youtube premium", "amc theatres", "cinemark", "regal cinemas", "ticketmaster",
        "stubhub", "theme park", "six flags", "universal studios", "disneyland",
        "casino", "gambling", "lottery", "golf course", "gym membership",
        "fitness membership", "museum", "zoo", "aquarium", "live nation"
    ],
}


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Improves OCR accuracy on photographed physical receipts (glare, shadows,
    low contrast, low resolution). Digital/PDF-native text never hits this
    path, so this only affects real photo uploads.

    Caps the maximum dimension BEFORE running grayscale/contrast/sharpen
    passes - phone camera photos are often 3000-4000px wide, and running
    multiple full-resolution image transforms back to back can spike memory
    usage past what Render's free tier (512MB) allows, causing the whole
    process to be OOM-killed mid-request (seen as a 502 with no error log).
    """
    # Respect phone camera EXIF rotation metadata so the image isn't processed sideways
    image = ImageOps.exif_transpose(image)

    image = image.convert("L")

    # Cap the largest side BEFORE heavier processing to control memory use
    MAX_DIMENSION = 2000
    largest_side = max(image.width, image.height)
    if largest_side > MAX_DIMENSION:
        scale = MAX_DIMENSION / largest_side
        image = image.resize(
            (int(image.width * scale), int(image.height * scale)), Image.LANCZOS
        )

    image = ImageOps.autocontrast(image, cutoff=2)
    image = ImageEnhance.Contrast(image).enhance(1.5)

    # Upscale only if still small after any downscaling above
    if image.width < 1200:
        ratio = 1200 / image.width
        image = image.resize((1200, int(image.height * ratio)), Image.LANCZOS)

    image = image.filter(ImageFilter.SHARPEN)
    return image


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Runs Tesseract twice with different page segmentation modes and combines
    both outputs. Different receipt layouts (a uniform dot-matrix table vs. a
    large bold header + smaller line-item table) are handled better by
    different PSM modes - there is no single setting that reliably works
    best for every layout. Giving Groq both versions increases the chance
    that whichever field (date, merchant, amount) got garbled in one pass
    is readable in the other.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image = preprocess_image_for_ocr(image)

        text_psm6 = pytesseract.image_to_string(image, config="--oem 3 --psm 6")
        text_psm4 = pytesseract.image_to_string(image, config="--oem 3 --psm 4")

        combined = (
            "--- OCR ATTEMPT 1 ---\n"
            + text_psm6
            + "\n--- OCR ATTEMPT 2 (different text segmentation) ---\n"
            + text_psm4
        )
        return combined
    except Exception:
        return ""


def extract_amount(text: str) -> Optional[float]:
    """Regex-based fallback amount extraction, used only if Groq extraction fails."""
    text_lower = text.lower()

    for keyword in AMOUNT_KEYWORDS:
        pattern = r"\b" + re.escape(keyword) + r"\b"
        matches = list(re.finditer(pattern, text_lower))
        if matches:
            idx = matches[-1].start()
            window = text[idx: idx + len(keyword) + 40]
            numbers = re.findall(r"[\d,]+\.\d{2}|\d{2,}", window)
            if numbers:
                cleaned = numbers[-1].replace(",", "")
                try:
                    return float(cleaned)
                except ValueError:
                    continue

    all_numbers = re.findall(r"[\d,]+\.\d{2}", text)
    if all_numbers:
        try:
            amounts = [float(n.replace(",", "")) for n in all_numbers]
            return max(amounts)
        except ValueError:
            pass

    all_ints = re.findall(r"\b\d{2,}\b", text)
    if all_ints:
        try:
            amounts = [float(n) for n in all_ints]
            return max(amounts)
        except ValueError:
            pass

    return None


def extract_date(text: str) -> Optional[date_type]:
    """Regex-based fallback date extraction, used only if Groq extraction fails."""
    for pattern, fmt in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                date_str = match.group(0)
                if fmt == "%d %B %Y":
                    parsed = datetime.strptime(date_str, "%d %B %Y")
                elif fmt == "%d/%m/%y":
                    parsed = datetime.strptime(date_str.replace("-", "/"), "%d/%m/%y")
                elif fmt == "%Y/%m/%d":
                    parsed = datetime.strptime(date_str.replace("-", "/"), "%Y/%m/%d")
                else:
                    parsed = datetime.strptime(date_str.replace("-", "/"), "%d/%m/%Y")
                return parsed.date()
            except ValueError:
                continue
    return None


def extract_merchant(text: str) -> Optional[str]:
    """Regex-based fallback merchant extraction, used only if Groq extraction fails."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        for line in lines[:3]:
            if len(line) > 2 and not re.match(r"^[\d\s\-/:.,]+$", line):
                return line[:100]
    return None


def detect_category(text: str) -> str:
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return category
    return "Other"


def _parse_ai_date(date_str: Optional[str]) -> Optional[date_type]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None


def process_receipt(file_bytes: bytes) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    text = extract_text_from_image(file_bytes)
    return _extract_all_fields(text)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
        pdf_document.close()
        if text.strip():
            return text
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        page = pdf_document[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")
        pdf_document.close()
        return extract_text_from_image(img_bytes)
    except Exception:
        return ""


def _normalize_common_ocr_date_artifacts(text: str) -> str:
    """
    Tesseract commonly misreads a leading '1' in a two-digit day as a stray
    symbol immediately before the next digit (e.g. "{7" instead of "17"),
    especially right after a "Date:" label. This deterministically corrects
    that specific, recurring pattern rather than relying on the LLM to infer
    it correctly every time - an 8B model applies this kind of subtle
    character-level reasoning inconsistently even when told about it directly.
    """
    pattern = re.compile(r"(date\s*[:\-]?\s*)([{(\[|iIl])(\d)(?=\s*[/\-])", re.IGNORECASE)
    return pattern.sub(lambda m: f"{m.group(1)}1{m.group(3)}", text)


def _extract_all_fields(text: str) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    """
    Groq is the primary extraction path for amount/merchant/date/category,
    since it handles varying receipt formats and ambiguous keywords far
    better than fixed patterns. Keyword-based fallbacks only fill in what
    Groq couldn't confidently determine, or run if the Groq call fails
    entirely (rate limit, network issue, etc).
    """
    text = _normalize_common_ocr_date_artifacts(text)

    from app.services.ai_service import extract_receipt_data, classify_category

    ai_result = extract_receipt_data(text)

    amount = ai_result.get("amount")
    if amount is None:
        amount = extract_amount(text)

    merchant = ai_result.get("merchant")
    if merchant is None:
        merchant = extract_merchant(text)

    extracted_date = _parse_ai_date(ai_result.get("date"))
    if extracted_date is None:
        extracted_date = extract_date(text)

    category = classify_category(text, merchant)
    if category == "Other":
        category = detect_category(text)

    return text, amount, merchant, extracted_date, category


def process_receipt_file(file_bytes: bytes, content_type: str) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    if content_type == "application/pdf":
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_image(file_bytes)

    return _extract_all_fields(text)