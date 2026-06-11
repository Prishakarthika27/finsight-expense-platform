# Architecture Document
## FinSight — AI-Powered Expense Management Platform

**Version:** 1.0  
**Date:** June 2026  

---

## 1. System Overview

FinSight is a three-tier web application:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│         Next.js 14 (App Router) — hosted on Vercel          │
│   TypeScript · Tailwind CSS · shadcn/ui · Recharts          │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS (REST API)
                       │  + Supabase SDK (auth/storage direct)
┌──────────────────────▼──────────────────────────────────────┐
│                       SERVER TIER                           │
│            FastAPI (Python) — hosted on Render              │
│    Routers · Services · OCR (Tesseract) · PDF (PyMuPDF)     │
└──────────────────────┬──────────────────────────────────────┘
                       │  supabase-py (service role)
┌──────────────────────▼──────────────────────────────────────┐
│                        DATA TIER                            │
│                    Supabase (managed)                       │
│         PostgreSQL · Auth · Storage · Row Level Security    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

FinSight uses the Next.js 14 **App Router** with route groups to separate authenticated and public areas:

```
app/
├── (auth)/              # Public routes — no layout shell
│   ├── login/
│   └── register/
├── (dashboard)/         # Protected routes — shared sidebar layout
│   ├── layout.tsx       # Sidebar + Header wrapper
│   ├── dashboard/       # Home: summary cards + charts
│   ├── expenses/        # Expense table + add/edit modal
│   ├── scan/            # OCR bill scanner
│   ├── statements/      # Bank statement upload + transactions
│   ├── documents/       # Document list + signature
│   ├── analytics/       # Full analytics page
│   └── settings/        # Profile settings
├── layout.tsx           # Root layout (fonts, providers)
└── page.tsx             # Landing page
```

### 2.2 Component Architecture

Components are grouped by feature, not by type:

```
components/
├── ui/           # shadcn/ui primitives (Button, Card, Input...)
├── layout/       # Sidebar, Header, MobileNav, ThemeProvider
├── shared/       # Reusable: PageHeader, EmptyState, LoadingSpinner, ConfirmDialog
├── dashboard/    # StatCard, SpendingChart, RecentTransactions
├── expenses/     # ExpenseTable, ExpenseForm, ExpenseFilters, CategoryBadge
├── scanner/      # DropZone, OCRResultPreview, ScanLoader
├── statements/   # StatementUpload, TransactionTable, StatementStatus
├── analytics/    # DonutChart, BarChart, CategoryBreakdown, MonthlyTrend
└── documents/    # DocumentList, DocumentCard, SignatureCanvas, SignatureModal
```

### 2.3 State Management

No external state library (Redux/Zustand) is used in v1.0. State is managed via:
- **React `useState` / `useReducer`** for local component state
- **Custom hooks** in `lib/hooks/` for data fetching and shared logic
- **URL search params** for filter state (so filters survive page refresh)

Key custom hooks:
```
lib/hooks/
├── useExpenses.ts       # fetch, create, update, delete expenses
├── useOCR.ts            # handle file upload + OCR result
├── useStatements.ts     # upload + poll statement status
├── useAnalytics.ts      # fetch summary, category, monthly data
├── useDocuments.ts      # upload, sign, list documents
└── useUser.ts           # current user profile
```

### 2.4 API Communication Layer

All backend calls go through wrapper functions in `lib/api/`:
```
lib/api/
├── client.ts            # Base fetch wrapper with auth header injection
├── expenses.ts          # getExpenses, createExpense, updateExpense, deleteExpense
├── ocr.ts               # scanBill
├── statements.ts        # uploadStatement, getTransactions
├── analytics.ts         # getSummary, getByCategory, getMonthlyTrend
└── documents.ts         # uploadDocument, signDocument, getDocuments
```

The base client automatically attaches the Supabase JWT from the active session to every request.

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
app/
├── main.py              # App init, CORS, router registration
├── config.py            # Environment config via pydantic-settings
├── database.py          # Supabase client singleton
├── dependencies.py      # get_current_user() — JWT verification dependency
├── models/              # Pydantic schemas (request/response shapes)
│   ├── expense.py
│   ├── statement.py
│   ├── document.py
│   └── user.py
├── routers/             # Thin route handlers — delegate to services
│   ├── expenses.py
│   ├── ocr.py
│   ├── statements.py
│   ├── analytics.py
│   ├── documents.py
│   └── auth.py
├── services/            # Business logic — independent of HTTP layer
│   ├── ocr_service.py
│   ├── pdf_service.py
│   ├── expense_service.py
│   ├── storage_service.py
│   └── analytics_service.py
└── utils/
    ├── file_helpers.py
    └── date_helpers.py
```

### 3.2 Request Lifecycle

```
HTTP Request
    │
    ▼
FastAPI Router (routers/*.py)
    │
    ▼
dependencies.py → verify JWT → inject current_user
    │
    ▼
Service Layer (services/*.py) → business logic
    │
    ▼
Supabase Client (database.py) → DB query / storage operation
    │
    ▼
HTTP Response (Pydantic model)
```

### 3.3 OCR Service Pipeline

```
Image Upload (multipart/form-data)
    │
    ▼
File validation (MIME type, size)
    │
    ▼
Pillow preprocessing
  → convert to grayscale
  → increase contrast
  → denoise
    │
    ▼
pytesseract.image_to_string()
    │
    ▼
Regex extraction
  → amount  (₹/Rs/Total patterns)
  → date    (DD/MM/YYYY, DD Mon YYYY)
  → vendor  (first meaningful line)
    │
    ▼
Return structured JSON
```

### 3.4 PDF Statement Pipeline

```
PDF Upload
    │
    ▼
PyMuPDF (fitz) → extract text per page
    │
    ▼
Concatenate all pages
    │
    ▼
Regex → identify transaction rows
  → date pattern
  → description (variable length)
  → debit amount | credit amount
    │
    ▼
Classify each row (credit / debit)
    │
    ▼
Auto-categorize by keyword matching
    │
    ▼
Bulk insert into transactions table
    │
    ▼
Update statement status → "completed"
```

---

## 4. Database Architecture

Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables.

### 4.1 Entity Relationship

```
auth.users (Supabase managed)
    │ 1:1
    ▼
profiles
    │
    ├──── 1:N ──── expenses
    │
    ├──── 1:N ──── statements
    │                  │
    │                  └── 1:N ── transactions
    │
    └──── 1:N ──── documents
```

### 4.2 RLS Strategy

All tables use the same pattern:
```sql
USING (auth.uid() = user_id)
```
This means every query is automatically scoped to the logged-in user — even if the backend makes a mistake, the DB will never return another user's data.

---

## 5. Storage Architecture

Supabase Storage is used for all file storage.

### 5.1 Bucket Structure

| Bucket | Contents | Access |
|--------|----------|--------|
| `receipts` | OCR bill images | Private (user-scoped) |
| `statements` | Bank statement PDFs | Private (user-scoped) |
| `documents` | User uploaded docs | Private (user-scoped) |
| `signatures` | Signature PNG files | Private (user-scoped) |
| `avatars` | User profile pictures | Public |

### 5.2 Upload Strategy

- **From frontend:** Direct upload using Supabase Storage SDK (avoids routing large files through the backend)
- **For OCR:** Image sent directly to FastAPI backend as multipart — not stored until user confirms expense
- **File paths:** `{bucket}/{user_id}/{uuid}.{ext}` — ensures no conflicts between users

---

## 6. Authentication Architecture

```
User submits login form
    │
    ▼
Supabase Auth → validates credentials → returns session
    │
    ▼
@supabase/ssr → stores JWT in HTTP-only cookie
    │
    ▼
middleware.ts runs on every request
  → reads cookie
  → if no session → redirect to /login
  → if session exists → allow request
    │
    ▼
API calls → extract JWT from cookie → send as Bearer token
    │
    ▼
FastAPI dependency → verify JWT with Supabase secret → inject user
```

---

## 7. Deployment Architecture

```
Developer Machine
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    ├── Vercel watches main branch
    │     → builds Next.js
    │     → deploys to finsight.vercel.app
    │
    └── Render watches main branch
          → builds Python env
          → installs Tesseract
          → starts uvicorn server
          → deploys to finsight-api.onrender.com
```

### 7.1 Environment Variables

**Vercel (Frontend)**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_BASE_URL
```

**Render (Backend)**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
SECRET_KEY
ALLOWED_ORIGINS
```

---

## 8. PWA Architecture

```
next.config.ts
    └── next-pwa plugin
          ├── generates service worker (sw.js)
          ├── caches static assets
          └── serves offline fallback

public/
├── manifest.json       → app name, icons, theme color, display: standalone
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 9. Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend framework | Next.js 14 App Router | Server components, nested layouts, middleware support |
| Backend framework | FastAPI | Async support, auto docs, fast Python API development |
| Database | Supabase | Built-in auth, RLS, storage — reduces backend complexity |
| OCR | Tesseract | Open source, no API cost, sufficient for printed receipts |
| PDF parsing | PyMuPDF | Fast, accurate text extraction, no external dependencies |
| Styling | Tailwind + shadcn/ui | Rapid UI development with accessible components |
| Charts | Recharts | React-native, composable, good TypeScript support |
| Deployment | Vercel + Render | Free tiers, auto-deploy from GitHub, industry standard |
