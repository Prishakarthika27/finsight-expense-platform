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


# Common date patterns found on receipts
DATE_PATTERNS = [
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", "%d/%m/%Y"),
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})", "%d/%m/%y"),
    (r"(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})", "%Y/%m/%d"),
    (r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})", "%d %B %Y"),
]

# Keywords that often precede the total amount (ordered from most specific to most generic)
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
        "soup", "salad", "dessert", "beverage", "cooldrink", "mocktail", "starter"
    ],
    "Travel": [
        "uber", "ola", "taxi", "fuel", "petrol", "diesel", "airlines", "railway", "metro",
        "cab", "auto", "rapido", "indigo", "irctc", "bus", "ticket", "toll", "parking",
        "rental car", "flight", "station", "platform", "fare", "km", "mileage"
    ],
    "Shopping": [
        "mart", "store", "shop", "mall", "retail", "supermarket", "fashion", "apparel",
        "clothing", "footwear", "electronics", "outlet", "boutique", "lifestyle",
        "reliance", "dmart", "big bazaar", "myntra", "amazon", "flipkart", "decathlon",
        "jewellery", "cosmetics", "stationery", "gift"
    ],
    "Bills": [
        "electricity", "water bill", "gas bill", "broadband", "internet", "mobile recharge",
        "postpaid", "prepaid", "wifi", "dth", "utility", "bescom", "bses", "airtel",
        "jio", "vodafone", "vi ", "tata power", "maintenance", "society", "rent receipt"
    ],
    "Healthcare": [
        "pharmacy", "hospital", "clinic", "medical", "medicine", "doctor", "diagnostic",
        "lab", "test report", "tablet", "syrup", "prescription", "chemist", "apollo",
        "consultation", "x-ray", "scan", "dental", "physio", "ayurveda"
    ],
    "Entertainment": [
        "cinema", "movie", "theatre", "netflix", "spotify", "game", "pvr", "inox",
        "amusement", "park", "concert", "show", "bowling", "arcade", "club",
        "subscription", "prime video", "hotstar", "ott"
    ],
}


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Improves OCR accuracy on photographed physical receipts (glare, shadows,
    low contrast, low resolution). Digital/PDF-native text never hits this
    path, so this only affects real photo uploads.
    """
    # Convert to grayscale - removes color noise/glare tint
    image = image.convert("L")

    # Auto-stretch the contrast histogram - helps a lot with glare and faded thermal print
    image = ImageOps.autocontrast(image, cutoff=2)

    # Boost contrast a bit further
    image = ImageEnhance.Contrast(image).enhance(1.5)

    # Upscale small images - Tesseract does noticeably better on higher resolution text
    if image.width < 1500:
        ratio = 1500 / image.width
        new_size = (1500, int(image.height * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    # Sharpen edges to make thermal-printer dot-matrix text more distinct
    image = image.filter(ImageFilter.SHARPEN)

    return image


def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image = preprocess_image_for_ocr(image)
        # --oem 3: default LSTM engine, --psm 6: assume a uniform block of text
        # (works well for receipt-style line items)
        text = pytesseract.image_to_string(image, config="--oem 3 --psm 6")
        return text
    except Exception:
        # Tesseract not available - return empty string and let AI handle categorization
        return ""


def extract_amount(text: str) -> Optional[float]:
    text_lower = text.lower()

    # First pass: look for a number near a keyword, matching whole words only
    # (so "total" doesn't false-match inside "subtotal" or "totalitems"),
    # and preferring the LAST occurrence, since the real total usually comes
    # after subtotal/tax lines on a receipt.
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

    # Fallback: largest decimal number in the whole text
    all_numbers = re.findall(r"[\d,]+\.\d{2}", text)
    if all_numbers:
        try:
            amounts = [float(n.replace(",", "")) for n in all_numbers]
            return max(amounts)
        except ValueError:
            pass

    # Second fallback: largest plain integer (2+ digits) anywhere in the text.
    # Needed for receipts with whole-rupee amounts and no decimal points at all.
    all_ints = re.findall(r"\b\d{2,}\b", text)
    if all_ints:
        try:
            amounts = [float(n) for n in all_ints]
            return max(amounts)
        except ValueError:
            pass

    return None


def extract_date(text: str) -> Optional[date_type]:
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
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        # Usually the merchant name is in the first few non-empty lines
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


def process_receipt(file_bytes: bytes) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    text = extract_text_from_image(file_bytes)
    amount = extract_amount(text)
    merchant = extract_merchant(text)
    extracted_date = extract_date(text)
    category = detect_category(text)
    return text, amount, merchant, extracted_date, category
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
        pdf_document.close()
        if text.strip():
            return text
        # If no text extracted, try image-based OCR
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        page = pdf_document[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")
        pdf_document.close()
        return extract_text_from_image(img_bytes)
    except Exception:
        return ""


def process_receipt_file(file_bytes: bytes, content_type: str) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    if content_type == "application/pdf":
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_image(file_bytes)

    amount = extract_amount(text)
    merchant = extract_merchant(text)
    extracted_date = extract_date(text)
    category = detect_category(text)

    # If keyword matching found nothing specific, try AI classification
    if category == "Other":
        from app.services.ai_service import classify_category
        category = classify_category(text, merchant)

    return text, amount, merchant, extracted_date, category