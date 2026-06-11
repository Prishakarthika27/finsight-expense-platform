# API Reference
## FinSight — AI-Powered Expense Management Platform

**Version:** 1.0  
**Base URL:** `http://localhost:8000/api/v1` (dev) · `https://finsight-api.onrender.com/api/v1` (prod)  
**Date:** June 2026

---

## Overview

All endpoints except `/health` require authentication via a Supabase JWT passed as a Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

The token is obtained from the Supabase session after login and is sent automatically by the frontend's API client layer.

### Standard Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error:**
```json
{
  "detail": "Human-readable error message",
  "status": 400
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — successful GET, PUT |
| 201 | Created — successful POST |
| 204 | No Content — successful DELETE |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — token valid but resource belongs to another user |
| 404 | Not Found — resource does not exist |
| 422 | Unprocessable Entity — validation error (Pydantic) |
| 500 | Internal Server Error |

---

## Endpoints

---

### Health

#### `GET /health`

Returns API health status. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "service": "FinSight API"
}
```

---

### Expenses

#### `GET /api/v1/expenses`

Returns all expenses for the authenticated user, sorted by date descending.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | No | Filter by category |
| date_from | date (YYYY-MM-DD) | No | Filter from this date |
| date_to | date (YYYY-MM-DD) | No | Filter to this date |
| limit | integer | No | Max results (default: 50) |
| offset | integer | No | Pagination offset (default: 0) |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 450.00,
      "currency": "INR",
      "category": "Food",
      "description": "Lunch at Swiggy",
      "date": "2026-06-10",
      "receipt_url": null,
      "created_at": "2026-06-10T13:22:00Z"
    }
  ],
  "total": 1,
  "message": "Success"
}
```

---

#### `POST /api/v1/expenses`

Creates a new expense.

**Request Body:**
```json
{
  "amount": 450.00,
  "currency": "INR",
  "category": "Food",
  "description": "Lunch at Swiggy",
  "date": "2026-06-10",
  "receipt_url": null
}
```

**Validation:**
- `amount`: required, > 0
- `category`: required, must be one of: `Food`, `Transport`, `Utilities`, `Health`, `Shopping`, `Entertainment`, `Other`
- `date`: required, valid date string

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "amount": 450.00,
    ...
  },
  "message": "Expense created"
}
```

---

#### `PUT /api/v1/expenses/{id}`

Updates an existing expense. User must own the expense.

**Path Params:** `id` — expense UUID

**Request Body:** Same fields as POST (all optional for partial update)

**Response `200`:**
```json
{
  "data": { ...updated expense... },
  "message": "Expense updated"
}
```

**Errors:**
- `404` — expense not found
- `403` — expense belongs to another user

---

#### `DELETE /api/v1/expenses/{id}`

Deletes an expense. User must own the expense.

**Path Params:** `id` — expense UUID

**Response `204`:** No content

---

### OCR

#### `POST /api/v1/ocr/scan`

Uploads a bill image and extracts expense data using Tesseract OCR.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Image file (JPG, PNG, WEBP, max 5MB) |

**Response `200`:**
```json
{
  "data": {
    "amount": 450.00,
    "date": "2026-06-10",
    "vendor": "BigBasket",
    "raw_text": "BigBasket\nDate: 10/06/2026\nTotal: ₹450.00\n...",
    "confidence": 0.85
  },
  "message": "OCR extraction complete"
}
```

**Notes:**
- `amount`, `date`, `vendor` may be `null` if OCR cannot extract them
- `confidence` is a 0–1 score based on Tesseract's word confidence average
- The returned data is for pre-filling the expense form — not saved automatically

**Errors:**
- `400` — unsupported file type or file too large
- `500` — OCR processing failed

---

### Statements

#### `POST /api/v1/statements/upload`

Uploads a bank statement PDF for processing.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | PDF file (max 10MB) |
| bank_name | string | No | Optional bank name hint |

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "status": "processing",
    "bank_name": "HDFC Bank",
    "created_at": "2026-06-10T14:00:00Z"
  },
  "message": "Statement uploaded, processing started"
}
```

**Notes:**
- Processing is synchronous in v1.0 — the response is returned after parsing completes
- Status will be `completed` or `failed` in the actual response

---

#### `GET /api/v1/statements`

Returns all statements uploaded by the authenticated user.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "bank_name": "HDFC Bank",
      "period_start": "2026-05-01",
      "period_end": "2026-05-31",
      "status": "completed",
      "created_at": "2026-06-10T14:00:00Z"
    }
  ],
  "message": "Success"
}
```

---

#### `GET /api/v1/statements/{id}/transactions`

Returns all transactions extracted from a specific statement.

**Path Params:** `id` — statement UUID

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter by `credit` or `debit` |
| category | string | Filter by category |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-05-15",
      "description": "SWIGGY ORDER",
      "amount": 320.00,
      "type": "debit",
      "category": "Food"
    }
  ],
  "total": 1,
  "message": "Success"
}
```

---

### Analytics

#### `GET /api/v1/analytics/summary`

Returns a summary of the authenticated user's expenses for the current month.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| month | integer | Month number (1–12), default: current month |
| year | integer | Year, default: current year |

**Response `200`:**
```json
{
  "data": {
    "total_expenses": 12450.00,
    "total_credits": 5000.00,
    "net_balance": -7450.00,
    "expense_count": 23,
    "period": "June 2026"
  },
  "message": "Success"
}
```

---

#### `GET /api/v1/analytics/by-category`

Returns spending breakdown by category for the current month.

**Query Parameters:** Same as summary (`month`, `year`)

**Response `200`:**
```json
{
  "data": [
    { "category": "Food", "total": 4200.00, "count": 12, "percentage": 33.7 },
    { "category": "Transport", "total": 1800.00, "count": 8, "percentage": 14.5 },
    { "category": "Shopping", "total": 3500.00, "count": 3, "percentage": 28.1 }
  ],
  "message": "Success"
}
```

---

#### `GET /api/v1/analytics/monthly`

Returns monthly expense totals for the last 6 months.

**Response `200`:**
```json
{
  "data": [
    { "month": "Jan 2026", "total": 9200.00 },
    { "month": "Feb 2026", "total": 11400.00 },
    { "month": "Mar 2026", "total": 8700.00 },
    { "month": "Apr 2026", "total": 13200.00 },
    { "month": "May 2026", "total": 10500.00 },
    { "month": "Jun 2026", "total": 12450.00 }
  ],
  "message": "Success"
}
```

---

### Documents

#### `POST /api/v1/documents/upload`

Uploads a document to Supabase Storage.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | PDF, PNG, JPG (max 10MB) |
| name | string | No | Custom display name (defaults to filename) |

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Bank Statement May 2026.pdf",
    "file_url": "https://supabase.co/storage/v1/...",
    "file_type": "application/pdf",
    "signed": false,
    "created_at": "2026-06-10T15:00:00Z"
  },
  "message": "Document uploaded"
}
```

---

#### `GET /api/v1/documents`

Returns all documents for the authenticated user.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Contract.pdf",
      "file_url": "...",
      "file_type": "application/pdf",
      "signed": true,
      "signature_url": "...",
      "created_at": "2026-06-10T15:00:00Z"
    }
  ],
  "message": "Success"
}
```

---

#### `POST /api/v1/documents/{id}/sign`

Applies a digital signature to a document.

**Path Params:** `id` — document UUID

**Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Notes:**
- `signature_data` is a base64-encoded PNG from the frontend canvas
- Backend decodes and uploads to Supabase Storage
- Document record updated: `signed = true`, `signature_url` set

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "signed": true,
    "signature_url": "https://supabase.co/storage/v1/..."
  },
  "message": "Document signed successfully"
}
```

---

#### `DELETE /api/v1/documents/{id}`

Deletes a document and its storage file.

**Response `204`:** No content

---

### Auth (Profile)

#### `GET /api/v1/auth/profile`

Returns the authenticated user's profile.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "full_name": "Prish",
    "avatar_url": null,
    "email": "prish@example.com",
    "created_at": "2026-01-15T10:00:00Z"
  },
  "message": "Success"
}
```

---

#### `PUT /api/v1/auth/profile`

Updates the authenticated user's profile.

**Request Body:**
```json
{
  "full_name": "Prish Kumar",
  "avatar_url": "https://supabase.co/storage/v1/..."
}
```

**Response `200`:**
```json
{
  "data": { ...updated profile... },
  "message": "Profile updated"
}
```

---

## Interactive API Docs

FastAPI auto-generates interactive documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

These are available in development mode and can be disabled in production via `FastAPI(docs_url=None)`.
