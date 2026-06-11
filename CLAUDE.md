# CLAUDE.md — FinSight Project Guide

> This file tells Claude (AI assistant) everything it needs to know to work effectively in this codebase.

---

## Project Overview

**FinSight** is an AI-powered expense management platform that allows users to track expenses, scan bills via OCR, analyze bank statements, and get financial insights through a professional dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| OCR | Tesseract OCR via pytesseract |
| Auth | Supabase Auth (JWT) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Version Control | GitHub |

---

## Repository Structure

```
FinSight/
├── frontend/                        # Next.js app
│   ├── app/                         # App Router pages
│   │   ├── (auth)/                  # Auth group (login, register)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/             # Protected dashboard group
│   │   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   │   ├── dashboard/page.tsx   # Main dashboard
│   │   │   ├── expenses/page.tsx    # Expense list + add
│   │   │   ├── scan/page.tsx        # OCR bill scanner
│   │   │   ├── statements/page.tsx  # Bank statement upload
│   │   │   ├── documents/page.tsx   # Document management
│   │   │   ├── analytics/page.tsx   # Charts and insights
│   │   │   └── settings/page.tsx    # User settings
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (auto-generated)
│   │   ├── layout/                  # Sidebar, Header, MobileNav
│   │   ├── dashboard/               # Dashboard widgets
│   │   ├── expenses/                # Expense table, form, filters
│   │   ├── scanner/                 # OCR upload + result preview
│   │   ├── statements/              # Statement upload + transaction table
│   │   ├── analytics/               # Charts (Recharts)
│   │   ├── documents/               # Document list + signature
│   │   └── shared/                  # Buttons, modals, loaders, badges
│   ├── lib/
│   │   ├── supabase/                # Supabase client (browser + server)
│   │   ├── api/                     # API call functions (fetch wrappers)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils.ts                 # Shared utility functions
│   │   └── types.ts                 # Global TypeScript types
│   ├── public/
│   │   ├── icons/                   # PWA icons
│   │   └── manifest.json            # PWA manifest
│   ├── middleware.ts                 # Auth middleware (route protection)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                         # FastAPI app
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point, CORS, routers
│   │   ├── config.py                # Settings via pydantic-settings
│   │   ├── database.py              # Supabase client init
│   │   ├── dependencies.py          # Auth dependency (JWT verification)
│   │   ├── models/                  # Pydantic request/response models
│   │   │   ├── expense.py
│   │   │   ├── statement.py
│   │   │   ├── document.py
│   │   │   └── user.py
│   │   ├── routers/                 # Route handlers
│   │   │   ├── expenses.py          # CRUD for expenses
│   │   │   ├── ocr.py               # Bill scan + extraction
│   │   │   ├── statements.py        # PDF statement parsing
│   │   │   ├── documents.py         # Document upload/download
│   │   │   ├── analytics.py         # Aggregated data for charts
│   │   │   └── auth.py              # Auth helpers (profile, etc.)
│   │   ├── services/                # Business logic layer
│   │   │   ├── ocr_service.py       # Tesseract OCR logic
│   │   │   ├── pdf_service.py       # PyMuPDF statement parsing
│   │   │   ├── expense_service.py   # Expense categorization logic
│   │   │   ├── storage_service.py   # Supabase Storage operations
│   │   │   └── analytics_service.py # Aggregation queries
│   │   └── utils/
│   │       ├── file_helpers.py      # File type validation, temp file cleanup
│   │       └── date_helpers.py      # Date parsing utilities
│   ├── tests/
│   │   ├── test_expenses.py
│   │   ├── test_ocr.py
│   │   └── test_statements.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Procfile                     # For Render deployment
│
├── docs/
│   ├── BRD.md                       # Business Requirements Document
│   ├── SRS.md                       # Software Requirements Specification
│   ├── Architecture.md              # System architecture overview
│   ├── DatabaseDesign.md            # DB schema + ERD
│   └── API.md                       # API endpoint reference
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
│
├── .gitignore
├── README.md
└── CLAUDE.md                        # ← You are here
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SECRET_KEY=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

---

## Database Schema (Supabase PostgreSQL)

### Tables

**users** — managed by Supabase Auth (auth.users), extended via profiles table
```sql
profiles (id uuid PK FK auth.users, full_name text, avatar_url text, created_at timestamptz)
```

**expenses**
```sql
id uuid PK, user_id uuid FK profiles, amount numeric, currency text default 'INR',
category text, description text, date date, receipt_url text, created_at timestamptz
```

**statements**
```sql
id uuid PK, user_id uuid FK profiles, file_url text, bank_name text,
period_start date, period_end date, status text, created_at timestamptz
```

**transactions** (extracted from statements)
```sql
id uuid PK, statement_id uuid FK statements, user_id uuid FK profiles,
date date, description text, amount numeric, type text (credit/debit), category text
```

**documents**
```sql
id uuid PK, user_id uuid FK profiles, name text, file_url text,
file_type text, signed boolean default false, signature_url text, created_at timestamptz
```

---

## API Conventions

- All protected routes require `Authorization: Bearer <supabase_jwt>` header
- Base URL: `http://localhost:8000/api/v1`
- Response format:
```json
{ "data": {}, "message": "Success", "status": 200 }
```
- Error format:
```json
{ "detail": "Error description", "status": 400 }
```

### Key Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /expenses | List user's expenses |
| POST | /expenses | Create expense |
| PUT | /expenses/{id} | Update expense |
| DELETE | /expenses/{id} | Delete expense |
| POST | /ocr/scan | Upload bill image → extract expense data |
| POST | /statements/upload | Upload bank statement PDF |
| GET | /statements/{id}/transactions | Get parsed transactions |
| GET | /analytics/summary | Dashboard summary stats |
| GET | /analytics/by-category | Spending by category |
| GET | /analytics/monthly | Monthly trend data |
| POST | /documents/upload | Upload a document |
| POST | /documents/{id}/sign | Apply digital signature |

---

## Development Workflow

### Starting the project
```bash
# Frontend
cd frontend
npm install
npm run dev          # runs on localhost:3000

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Commit Convention
Follow conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `chore:` setup/config
- `docs:` documentation
- `style:` UI/styling only
- `refactor:` code cleanup

Example: `feat(ocr): add bill scanning endpoint with Tesseract`

---

## Key Implementation Notes

1. **Auth flow**: Supabase handles auth client-side. The backend verifies the JWT from Supabase using the `SUPABASE_JWT_SECRET`. Never expose service role keys to the frontend.

2. **OCR Pipeline**: Image → Pillow preprocessing → Tesseract → regex extraction of amount/date/vendor → return structured JSON.

3. **PDF Parsing**: PyMuPDF (`fitz`) reads bank statement PDFs → extract text per page → regex/LLM parsing for transactions → store in `transactions` table.

4. **File uploads**: Frontend uploads directly to Supabase Storage using signed URLs. Backend receives the storage path, not the file itself (except for OCR which needs the image bytes).

5. **Digital signatures**: Use `canvas` on frontend for signature drawing → convert to base64 PNG → upload to Supabase Storage → store URL in documents table.

6. **PWA**: Add `manifest.json` and service worker via `next-pwa` package.

7. **Row Level Security (RLS)**: All Supabase tables must have RLS enabled. Users can only access their own rows (`user_id = auth.uid()`).

---

## UI Design System

- **Color palette**: Dark theme with slate-900 background, emerald-500 as primary accent
- **Typography**: Inter (body), Geist Mono (numbers/code)
- **Components**: shadcn/ui base + custom wrappers in `components/shared/`
- **Charts**: Recharts library
- **Icons**: Lucide React

---

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend type check
cd frontend
npx tsc --noEmit
```

---

## Deployment Checklist

- [ ] Set all env vars in Vercel (frontend) and Render (backend)
- [ ] Enable RLS on all Supabase tables
- [ ] Set `ALLOWED_ORIGINS` in backend to include Vercel URL
- [ ] Run `npm run build` locally before pushing to Vercel
- [ ] Add `Procfile` to backend for Render: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
