# Database Design Document
## FinSight — AI-Powered Expense Management Platform

**Version:** 1.0  
**Date:** June 2026  
**Database:** Supabase (PostgreSQL 15)

---

## 1. Overview

FinSight uses a single Supabase PostgreSQL database with 5 application tables, all secured via Row Level Security (RLS). Authentication is handled by Supabase Auth (`auth.users`), which serves as the root of all user data relationships.

---

## 2. Entity Relationship Diagram

```
┌─────────────────────┐
│    auth.users        │  ← Managed by Supabase Auth
│  (id, email, ...)   │
└────────┬────────────┘
         │ 1:1 (on user creation trigger)
         ▼
┌─────────────────────┐
│      profiles        │
│  id (PK = auth.uid) │
│  full_name           │
│  avatar_url          │
│  created_at          │
└──────┬──────────────┘
       │
       ├──────────────────────────────────────┐
       │ 1:N                                  │ 1:N
       ▼                                      ▼
┌─────────────────┐                 ┌──────────────────────┐
│    expenses      │                 │      statements       │
│  id (PK)        │                 │  id (PK)             │
│  user_id (FK)   │                 │  user_id (FK)        │
│  amount          │                 │  file_url            │
│  currency        │                 │  bank_name           │
│  category        │                 │  period_start        │
│  description     │                 │  period_end          │
│  date            │                 │  status              │
│  receipt_url     │                 │  created_at          │
│  created_at      │                 └──────────┬───────────┘
└─────────────────┘                            │ 1:N
       │                                        ▼
       │                            ┌──────────────────────┐
       │                            │     transactions      │
       │                            │  id (PK)             │
       │                            │  statement_id (FK)   │
       │                            │  user_id (FK)        │
       │                            │  date                │
       │                            │  description         │
       │                            │  amount              │
       │                            │  type (credit/debit) │
       │                            │  category            │
       │                            └──────────────────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│    documents     │
│  id (PK)        │
│  user_id (FK)   │
│  name            │
│  file_url        │
│  file_type       │
│  signed          │
│  signature_url   │
│  created_at      │
└─────────────────┘
```

---

## 3. Table Definitions

### 3.1 profiles

Extends Supabase's built-in `auth.users`. Created automatically via a database trigger on user signup.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → auth.users | Same as Supabase auth user ID |
| full_name | text | nullable | Display name |
| avatar_url | text | nullable | URL in Supabase Storage |
| created_at | timestamptz | not null, default now() | Account creation time |

**Trigger — auto-create profile on signup:**
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### 3.2 expenses

Stores all manually entered and OCR-scanned expenses.

```sql
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null default 'INR',
  category    text not null,
  description text,
  date        date not null,
  receipt_url text,
  created_at  timestamptz default now() not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Auto-generated |
| user_id | uuid | FK → profiles, not null | Owner |
| amount | numeric(12,2) | > 0, not null | Expense amount |
| currency | text | not null, default INR | Currency code |
| category | text | not null | Spending category |
| description | text | nullable | Optional notes |
| date | date | not null | Date of expense |
| receipt_url | text | nullable | Supabase Storage URL |
| created_at | timestamptz | not null | Record creation time |

**Allowed category values (enforced in application layer):**
`Food`, `Transport`, `Utilities`, `Health`, `Shopping`, `Entertainment`, `Other`

**Indexes:**
```sql
create index expenses_user_id_idx on expenses(user_id);
create index expenses_date_idx on expenses(date desc);
create index expenses_category_idx on expenses(category);
```

---

### 3.3 statements

Stores uploaded bank statement PDFs and their processing status.

```sql
create table statements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  file_url     text,
  bank_name    text,
  period_start date,
  period_end   date,
  status       text not null default 'processing'
                 check (status in ('processing', 'completed', 'failed')),
  created_at   timestamptz default now() not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Auto-generated |
| user_id | uuid | FK → profiles, not null | Owner |
| file_url | text | nullable | Supabase Storage URL |
| bank_name | text | nullable | Detected bank name |
| period_start | date | nullable | Statement period start |
| period_end | date | nullable | Statement period end |
| status | text | check constraint | `processing` / `completed` / `failed` |
| created_at | timestamptz | not null | Upload time |

---

### 3.4 transactions

Individual transactions extracted from a bank statement.

```sql
create table transactions (
  id           uuid primary key default gen_random_uuid(),
  statement_id uuid references statements(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  date         date,
  description  text,
  amount       numeric(12, 2),
  type         text check (type in ('credit', 'debit')),
  category     text
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Auto-generated |
| statement_id | uuid | FK → statements | Parent statement |
| user_id | uuid | FK → profiles, not null | Owner (denormalized for RLS) |
| date | date | nullable | Transaction date |
| description | text | nullable | Transaction description |
| amount | numeric(12,2) | nullable | Transaction amount |
| type | text | check constraint | `credit` or `debit` |
| category | text | nullable | Auto or manually assigned |

**Indexes:**
```sql
create index transactions_user_id_idx on transactions(user_id);
create index transactions_statement_id_idx on transactions(statement_id);
create index transactions_date_idx on transactions(date desc);
```

> **Note:** `user_id` is denormalized (also available via `statement_id → statements.user_id`) to enable efficient RLS policies without joins.

---

### 3.5 documents

User-uploaded documents with optional digital signature support.

```sql
create table documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  file_url      text,
  file_type     text,
  signed        boolean not null default false,
  signature_url text,
  created_at    timestamptz default now() not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Auto-generated |
| user_id | uuid | FK → profiles, not null | Owner |
| name | text | not null | Original file name |
| file_url | text | nullable | Supabase Storage URL |
| file_type | text | nullable | MIME type (e.g. `application/pdf`) |
| signed | boolean | not null, default false | Whether signature applied |
| signature_url | text | nullable | URL of signature PNG in storage |
| created_at | timestamptz | not null | Upload time |

---

## 4. Row Level Security Policies

All tables have RLS enabled. The policy for every table follows the same pattern — users can only access rows where `user_id = auth.uid()`.

```sql
-- Enable RLS
alter table profiles   enable row level security;
alter table expenses   enable row level security;
alter table statements enable row level security;
alter table transactions enable row level security;
alter table documents  enable row level security;

-- profiles: user can only access their own profile
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- expenses: full CRUD on own expenses only
create policy "Users manage own expenses"
  on expenses for all using (auth.uid() = user_id);

-- statements: full CRUD on own statements only
create policy "Users manage own statements"
  on statements for all using (auth.uid() = user_id);

-- transactions: read own transactions only
create policy "Users view own transactions"
  on transactions for all using (auth.uid() = user_id);

-- documents: full CRUD on own documents only
create policy "Users manage own documents"
  on documents for all using (auth.uid() = user_id);
```

---

## 5. Storage Buckets

```sql
-- Create storage buckets (via Supabase dashboard or API)
-- receipts     → private, user-scoped
-- statements   → private, user-scoped
-- documents    → private, user-scoped
-- signatures   → private, user-scoped
-- avatars      → public
```

**File path convention:**
```
{bucket_name}/{user_id}/{uuid}.{extension}
```

Example: `receipts/abc-123-uuid/bill-xyz-456.jpg`

---

## 6. Full SQL Setup Script

Run this in the Supabase SQL Editor to set up the entire database:

```sql
-- 1. Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- 2. Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  category text not null,
  description text,
  date date not null,
  receipt_url text,
  created_at timestamptz default now() not null
);

-- 3. Statements
create table statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_url text,
  bank_name text,
  period_start date,
  period_end date,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz default now() not null
);

-- 4. Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid references statements(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date,
  description text,
  amount numeric(12, 2),
  type text check (type in ('credit', 'debit')),
  category text
);

-- 5. Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  file_url text,
  file_type text,
  signed boolean not null default false,
  signature_url text,
  created_at timestamptz default now() not null
);

-- 6. Indexes
create index expenses_user_id_idx on expenses(user_id);
create index expenses_date_idx on expenses(date desc);
create index transactions_user_id_idx on transactions(user_id);
create index transactions_statement_id_idx on transactions(statement_id);

-- 7. RLS
alter table profiles enable row level security;
alter table expenses enable row level security;
alter table statements enable row level security;
alter table transactions enable row level security;
alter table documents enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own expenses" on expenses for all using (auth.uid() = user_id);
create policy "own statements" on statements for all using (auth.uid() = user_id);
create policy "own transactions" on transactions for all using (auth.uid() = user_id);
create policy "own documents" on documents for all using (auth.uid() = user_id);

-- 8. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
