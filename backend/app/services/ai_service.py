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

        # Validate response is one of our known categories
        for valid in VALID_CATEGORIES:
            if valid.lower() == category.lower():
                return valid

        return "Other"
    except Exception:
        return "Other"