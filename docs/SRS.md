# Software Requirements Specification (SRS)
## FinSight — AI-Powered Expense Management Platform

**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for FinSight — a full-stack AI-powered expense management web application. It serves as a technical reference for development, testing, and deployment.

### 1.2 Scope
FinSight consists of:
- A **Next.js** frontend (TypeScript, Tailwind CSS, shadcn/ui)
- A **FastAPI** backend (Python)
- A **Supabase** database and storage layer
- OCR processing via **Tesseract**
- PDF parsing via **PyMuPDF**

### 1.3 Definitions

| Term | Definition |
|------|------------|
| OCR | Optical Character Recognition — extracting text from images |
| JWT | JSON Web Token — used for stateless authentication |
| RLS | Row Level Security — Supabase policy to restrict data per user |
| PWA | Progressive Web App — installable web app with offline support |
| CRUD | Create, Read, Update, Delete — standard data operations |

---

## 2. Overall Description

### 2.1 System Architecture
FinSight follows a client-server architecture:

```
User Browser
    │
    ▼
Next.js Frontend (Vercel)
    │
    ├──► Supabase (Auth + DB + Storage) — direct from frontend for auth/storage
    │
    └──► FastAPI Backend (Render)
              │
              └──► Supabase DB (server-side queries)
              └──► Tesseract OCR
              └──► PyMuPDF (PDF parsing)
```

### 2.2 User Roles
- **Authenticated User** — has full access to their own data
- **Unauthenticated User** — can only access login and register pages

### 2.3 Assumptions and Dependencies
- Supabase project is active and accessible
- Tesseract OCR is installed on the Render server
- PyMuPDF (`fitz`) is available via pip
- Environment variables are set in both Vercel and Render

---

## 3. System Features

### 3.1 Authentication System

**Description:** Handles user registration, login, session persistence, and route protection.

**Inputs:** Email, password  
**Outputs:** Supabase session (JWT stored in cookies)

**Functional Flow:**
1. User submits register form → Supabase creates auth user → trigger creates `profiles` row
2. User submits login form → Supabase returns session → stored in HTTP-only cookies via `@supabase/ssr`
3. `middleware.ts` checks session on every request → redirects to `/login` if missing
4. Logout clears the session cookie

**Error Handling:**
- Invalid credentials → "Invalid email or password"
- Email already registered → "An account with this email already exists"
- Network error → "Something went wrong, please try again"

---

### 3.2 Expense Management

**Description:** Core CRUD operations for user expenses.

**Data Model:**
```
expense {
  id: uuid
  user_id: uuid
  amount: number
  currency: string (default: "INR")
  category: enum [Food, Transport, Utilities, Health, Shopping, Entertainment, Other]
  description: string
  date: date
  receipt_url: string | null
  created_at: timestamp
}
```

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/expenses | Get all expenses for authenticated user |
| POST | /api/v1/expenses | Create a new expense |
| PUT | /api/v1/expenses/{id} | Update an expense |
| DELETE | /api/v1/expenses/{id} | Delete an expense |

**Validation Rules:**
- `amount` must be > 0
- `date` must not be in the future
- `category` must be one of the allowed enum values
- `description` max 255 characters

---

### 3.3 OCR Bill Scanning

**Description:** Accepts an uploaded image of a bill or receipt and extracts expense data using Tesseract OCR.

**Supported Formats:** JPG, JPEG, PNG, WEBP (max 5MB)

**Processing Pipeline:**
1. Frontend uploads image to API (`POST /api/v1/ocr/scan`)
2. Backend receives image bytes
3. Pillow preprocesses image (grayscale, contrast enhancement)
4. Tesseract extracts raw text
5. Regex patterns extract:
   - Amount: patterns like `₹1,234.00`, `Rs. 500`, `Total: 250`
   - Date: patterns like `12/06/2026`, `12 Jun 2026`
   - Vendor: first non-empty line of text (heuristic)
6. Returns structured JSON to frontend
7. Frontend pre-fills expense form with extracted data

**Response Format:**
```json
{
  "amount": 450.00,
  "date": "2026-06-10",
  "vendor": "BigBasket",
  "raw_text": "...",
  "confidence": 0.82
}
```

---

### 3.4 Bank Statement Analysis

**Description:** Accepts a bank statement PDF and extracts individual transactions.

**Supported Format:** PDF (text-based, max 10MB)

**Processing Pipeline:**
1. Frontend uploads PDF to API (`POST /api/v1/statements/upload`)
2. Backend reads PDF with PyMuPDF
3. Text is extracted page by page
4. Regex patterns identify transaction rows (date + description + amount pattern)
5. Each transaction is classified as credit or debit
6. Transactions stored in `transactions` table linked to the statement
7. Statement status updated to `completed`

**Response:** Statement ID + transaction count

**Limitations:**
- Works best with standard bank statement formats (SBI, HDFC, ICICI typical formats)
- Scanned PDFs (image-based) are not supported in v1.0

---

### 3.5 Analytics Dashboard

**Description:** Displays aggregated financial data with visual charts.

**Metrics Displayed:**
- Total expenses (current month)
- Total credits (current month)
- Net balance
- Expenses by category (donut chart)
- Monthly trend — last 6 months (bar chart)
- Recent transactions (last 5)

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/analytics/summary | Monthly totals |
| GET | /api/v1/analytics/by-category | Category breakdown |
| GET | /api/v1/analytics/monthly | 6-month trend |

---

### 3.6 Document Management

**Description:** Upload, view, and manage financial documents with optional digital signature.

**Supported Formats:** PDF, PNG, JPG, JPEG (max 10MB)

**Features:**
- Upload documents to Supabase Storage
- View document list with name, type, date, signed status
- Download original document
- Apply digital signature (canvas drawing → PNG → overlaid on document)

**Signature Flow:**
1. User opens signature modal
2. User draws signature on HTML canvas
3. Canvas exported as base64 PNG
4. PNG uploaded to Supabase Storage
5. `documents.signed = true`, `documents.signature_url` updated

---

### 3.7 Progressive Web App (PWA)

**Description:** FinSight is installable as a PWA on mobile and desktop.

**Requirements:**
- `manifest.json` with app name, icons (192px, 512px), theme color
- Service worker registered via `next-pwa`
- Offline fallback page for no-connection state

---

## 4. External Interface Requirements

### 4.1 Frontend ↔ Backend
- Protocol: HTTPS (REST)
- Auth: `Authorization: Bearer <jwt>` header on all protected routes
- Content-Type: `application/json` (or `multipart/form-data` for file uploads)

### 4.2 Frontend ↔ Supabase
- Auth operations via `@supabase/ssr` (cookie-based sessions)
- Direct storage uploads via Supabase Storage SDK

### 4.3 Backend ↔ Supabase
- `supabase-py` client using service role key (server-side only)

---

## 5. Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Password storage | Handled by Supabase Auth (bcrypt) |
| Session tokens | HTTP-only cookies via `@supabase/ssr` |
| API authorization | JWT verified on every protected endpoint |
| Data isolation | Supabase RLS — users can only access their own rows |
| Secret keys | Stored in environment variables, never in source code |
| File validation | MIME type + extension check before processing |
| CORS | Backend allows only frontend origin |

---

## 6. Performance Requirements

| Scenario | Target |
|----------|--------|
| Dashboard initial load | < 2s |
| Expense list (100 rows) | < 500ms API response |
| OCR processing | < 10s |
| PDF statement parsing | < 15s for 10-page PDF |
| File upload (5MB) | < 5s |

---

## 7. Testing Requirements

- **Unit tests:** OCR extraction logic, PDF parsing, expense validation
- **Integration tests:** API endpoints with test Supabase project
- **Manual testing:** All user flows on Chrome (desktop) and Safari (mobile)
- **Type safety:** `npx tsc --noEmit` must pass with zero errors before each deployment
