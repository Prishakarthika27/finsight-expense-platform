import pytesseract
from app.config import get_settings

_settings = get_settings()
pytesseract.pytesseract.tesseract_cmd = _settings.tesseract_cmd
import fitz  # PyMuPDF
import re
from PIL import Image
from datetime import date as date_type, datetime
from typing import Optional, Tuple
import io


# Common date patterns found on receipts
DATE_PATTERNS = [
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", "%d/%m/%Y"),
    (r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})", "%d/%m/%y"),
    (r"(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})", "%Y/%m/%d"),
]

# Keywords that often precede the total amount
AMOUNT_KEYWORDS = [
    "total", "grand total", "amount due", "balance due",
    "total due", "net amount", "amount payable", "total amount"
]

CATEGORY_KEYWORDS = {
    "Food": ["restaurant", "cafe", "food", "pizza", "burger", "kitchen", "diner", "bakery"],
    "Travel": ["uber", "ola", "taxi", "fuel", "petrol", "diesel", "airlines", "railway", "metro"],
    "Shopping": ["mart", "store", "shop", "mall", "retail", "supermarket"],
    "Bills": ["electricity", "water bill", "gas bill", "broadband", "internet", "mobile recharge"],
    "Healthcare": ["pharmacy", "hospital", "clinic", "medical", "medicine", "doctor"],
    "Entertainment": ["cinema", "movie", "theatre", "netflix", "spotify", "game"],
}


def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(image)
    return text


def extract_amount(text: str) -> Optional[float]:
    lines = text.lower().split("\n")

    # First pass: look for amount near keywords
    for line in lines:
        for keyword in AMOUNT_KEYWORDS:
            if keyword in line:
                numbers = re.findall(r"[\d,]+\.\d{2}|\d+", line)
                if numbers:
                    cleaned = numbers[-1].replace(",", "")
                    try:
                        return float(cleaned)
                    except ValueError:
                        continue

    # Fallback: find the largest number with decimal in the whole text
    all_numbers = re.findall(r"[\d,]+\.\d{2}", text)
    if all_numbers:
        try:
            amounts = [float(n.replace(",", "")) for n in all_numbers]
            return max(amounts)
        except ValueError:
            pass

    return None


def extract_date(text: str) -> Optional[date_type]:
    for pattern, fmt in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            try:
                date_str = match.group(0)
                if fmt == "%d/%m/%y":
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
    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    page = pdf_document[0]

    # Render page to an image at higher resolution for better OCR accuracy
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_bytes = pix.tobytes("png")

    pdf_document.close()
    return extract_text_from_image(img_bytes)


def process_receipt_file(file_bytes: bytes, content_type: str) -> Tuple[str, Optional[float], Optional[str], Optional[date_type], str]:
    if content_type == "application/pdf":
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_image(file_bytes)

    amount = extract_amount(text)
    merchant = extract_merchant(text)
    extracted_date = extract_date(text)
    category = detect_category(text)
    return text, amount, merchant, extracted_date, category