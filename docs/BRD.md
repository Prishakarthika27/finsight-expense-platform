# Business Requirements Document (BRD)
## FinSight — AI-Powered Expense Management Platform

**Version:** 1.0  
**Date:** June 2026  
**Status:** Approved  

---

## 1. Executive Summary

FinSight is a web-based AI-powered expense management platform designed to help individuals and small teams track, categorize, and analyze their financial activity. It combines manual expense entry, OCR-based bill scanning, and automated bank statement analysis into a single unified dashboard — giving users real-time insight into their spending habits.

---

## 2. Business Objectives

| # | Objective |
|---|-----------|
| 1 | Reduce manual effort in expense logging through OCR automation |
| 2 | Provide users with actionable financial insights via visual analytics |
| 3 | Enable secure document management with digital signature support |
| 4 | Deliver a mobile-friendly experience accessible from any device |
| 5 | Build a production-ready, portfolio-grade full-stack application |

---

## 3. Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Project Owner / Developer | Prish | Full-stack development, design, deployment |
| End Users | Individuals / small teams | Track and manage personal/business expenses |

---

## 4. Problem Statement

Managing personal or business expenses today requires either expensive software (QuickBooks, Zoho) or tedious manual spreadsheet work. Users have no easy way to:
- Automatically extract data from physical bills or receipts
- Parse and analyze bank statement PDFs
- Get a visual summary of their spending by category or time period
- Store and sign financial documents in one place

FinSight solves all of these in a single, free, accessible web platform.

---

## 5. Scope

### 5.1 In Scope
- User registration and authentication
- Manual expense entry with categorization
- OCR-based bill/receipt scanning (image upload → auto-fill expense)
- Bank statement PDF upload and transaction extraction
- Expense analytics dashboard (charts, summaries, trends)
- Document management system (upload, view, download)
- Digital signature on documents
- Progressive Web App (installable on mobile)
- Responsive UI for desktop and mobile

### 5.2 Out of Scope (v1.0)
- Multi-currency live exchange rates
- Direct bank integrations (Plaid, Open Banking)
- Team collaboration / shared workspaces
- Invoice generation
- Tax computation or filing

---

## 6. Functional Requirements

### 6.1 Authentication
- FR-01: Users must be able to register with email and password
- FR-02: Users must be able to log in and log out securely
- FR-03: All dashboard routes must be protected and redirect unauthenticated users to login
- FR-04: User sessions must persist across page refreshes

### 6.2 Expense Management
- FR-05: Users can manually add an expense (amount, category, description, date)
- FR-06: Users can edit and delete their own expenses
- FR-07: Users can filter expenses by date range, category, or amount
- FR-08: Expenses are displayed in a paginated, sortable table

### 6.3 OCR Bill Scanning
- FR-09: Users can upload a photo or scan of a bill/receipt
- FR-10: The system must extract amount, date, and vendor name using OCR
- FR-11: Extracted data must be pre-filled into the expense form for user review before saving
- FR-12: Users can correct OCR results before submitting

### 6.4 Bank Statement Analysis
- FR-13: Users can upload a bank statement in PDF format
- FR-14: The system must parse and extract individual transactions
- FR-15: Extracted transactions must be displayed in a table with date, description, amount, and type (credit/debit)
- FR-16: Users can categorize extracted transactions manually or accept auto-categorization

### 6.5 Analytics Dashboard
- FR-17: Dashboard must show total spend, total income, and net balance for the current month
- FR-18: A pie/donut chart must display spending breakdown by category
- FR-19: A line/bar chart must show monthly expense trends over the last 6 months
- FR-20: Top spending categories must be highlighted

### 6.6 Document Management
- FR-21: Users can upload documents (PDF, PNG, JPG)
- FR-22: Users can view and download their uploaded documents
- FR-23: Users can draw a digital signature and apply it to a document
- FR-24: Signed documents are stored separately and marked as signed

### 6.7 Settings
- FR-25: Users can update their display name and avatar
- FR-26: Users can change their password

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time | < 2 seconds on desktop |
| NFR-02 | API response time | < 500ms for standard CRUD |
| NFR-03 | OCR processing time | < 10 seconds per image |
| NFR-04 | Uptime | 99% (Vercel + Render free tier) |
| NFR-05 | Mobile responsiveness | Works on screens ≥ 375px wide |
| NFR-06 | Security | JWT auth, RLS on all DB tables, no exposed secrets |
| NFR-07 | Accessibility | Keyboard navigable, proper ARIA labels |

---

## 8. Assumptions

- Users have a modern browser (Chrome, Firefox, Safari, Edge)
- Bank statement PDFs are text-based (not scanned images)
- OCR accuracy is acceptable for printed receipts; handwritten bills are not guaranteed
- The platform is single-user per account (no shared access in v1.0)

---

## 9. Constraints

- Free tier limits apply for Supabase (500MB DB, 1GB storage), Vercel, and Render
- Tesseract OCR accuracy depends on image quality
- PDF parsing accuracy depends on the formatting of the bank statement

---

## 10. Success Criteria

- All functional requirements (FR-01 to FR-26) are implemented and working
- Application is deployed and publicly accessible
- Mobile responsive on all major screen sizes
- No critical bugs in auth, expense CRUD, or OCR flow
- Codebase is clean, documented, and committed to GitHub
