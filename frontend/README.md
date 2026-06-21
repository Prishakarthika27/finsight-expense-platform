<div align="center">

# FinSight
### AI-Powered Expense Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![CI](https://github.com/Prishakarthika27/finsight-expense-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Prishakarthika27/finsight-expense-platform/actions/workflows/ci.yml)

**Track expenses, scan bills, analyze bank statements, and sign documents — all powered by AI.**

[Live Demo](#) • [Frontend](#) • [Backend API](#)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Folder Structure](#folder-structure)
- [Git Branch Strategy](#git-branch-strategy)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 🔍 Overview

FinSight is a full-stack AI-powered expense management platform built as a portfolio project. It combines OCR, AI categorization, PDF parsing, and real-time data visualization to give users a complete picture of their finances.

**Key highlights:**
- Real OCR (Tesseract) + AI (Groq Llama) for bill scanning and smart categorization
- PDF bank statement parsing with automatic transaction extraction
- Digital signature canvas with PDF embedding
- Production-grade security: RLS policies, private storage buckets, signed URLs
- PWA — installable on mobile and desktop
- Dark/light mode with persistent theme preference

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Supabase Auth with email/password, JWT sessions, auto-profile creation |
| 📊 **Dashboard** | Real-time stat cards + 3 Recharts charts (monthly spending, category distribution, income vs expense) |
| 💸 **Expense Tracker** | Full CRUD with 7 categories, date picker, currency formatting |
| 🧾 **Bill Scanner** | Upload JPG/PNG/PDF → Tesseract OCR → Groq AI categorization → auto expense creation |
| 🏦 **Bank Statement Analyzer** | Upload PDF → extract transactions → insights (income, expense, savings, top category) → CSV export |
| 📁 **Document Manager** | View, download (signed URLs), delete bills/statements/signed docs |
| ✍️ **Digital Signature** | Canvas drawing → save signature → embed into PDF → download signed document |
| 👤 **Profile** | View and edit name, display email, joined date |
| ❓ **Help Center** | FAQ accordion, Contact form (Formspree), Report Issue form |
| 🌐 **Public Pages** | Home page with animations, Platform overview with tech stack |
| 📱 **PWA** | Installable on mobile/desktop, works offline for cached pages |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui** components
- **Recharts** for data visualization
- **Lucide React** for icons
- **Framer Motion** / CSS animations for scroll effects
- **next-themes** for dark/light mode

### Backend
- **FastAPI** (Python 3.11+)
- **Tesseract OCR** via pytesseract
- **PyMuPDF** for PDF parsing and signing
- **Groq API** (Llama 3.1 8B) for AI categorization
- **Pydantic** for data validation
- **pytest** for testing

### Database & Storage
- **Supabase PostgreSQL** with Row Level Security
- **Supabase Storage** (private + public buckets)
- **Supabase Auth** for JWT-based authentication

### DevOps
- **GitHub Actions** CI pipeline
- **Vercel** (frontend deployment)
- **Render** (backend deployment)

---

## 📸 Screenshots

> Screenshots will be added after deployment.

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Tesseract OCR installed ([Windows guide](https://github.com/UB-Mannheim/tesseract/wiki))
- Supabase account
- Groq API key (free at console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/Prishakarthika27/finsight-expense-platform.git
cd finsight-expense-platform
```

### 2. Frontend setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your environment variables
npm run dev
```

### 3. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in your environment variables
uvicorn app.main:app --reload
```

### 4. Supabase setup
- Create a new Supabase project
- Run the SQL from `docs/DatabaseDesign.md` in the SQL Editor
- Enable RLS and create storage buckets: `receipts`, `statements`, `documents`, `signatures`, `avatars`

---

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SECRET_KEY=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGINS=http://localhost:3000
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## 🌍 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Add environment variables (same as `.env.local`)
4. Auto-deploys on every push to `main`

### Backend → Render
1. Connect GitHub repo to Render
2. Set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Add `TESSDATA_PREFIX` for Tesseract on Render

---

## 📁 Folder Structure