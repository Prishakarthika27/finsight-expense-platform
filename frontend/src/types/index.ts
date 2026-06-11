export type Category =
  | "Food"
  | "Travel"
  | "Shopping"
  | "Bills"
  | "Healthcare"
  | "Entertainment"
  | "Other"

export type TransactionType = "credit" | "debit"

export type DocumentFileType = "bill" | "statement" | "signed_document" | "other"

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  category: Category
  description: string
  date: string
  receipt_url: string | null
  created_at: string
}

export interface Statement {
  id: string
  user_id: string
  file_url: string
  bank_name: string
  period_start: string
  period_end: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
}

export interface Transaction {
  id: string
  statement_id: string
  user_id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  category: Category
}

export interface Document {
  id: string
  user_id: string
  name: string
  file_url: string
  file_type: DocumentFileType
  signed: boolean
  signature_url: string | null
  created_at: string
}

export interface DashboardStats {
  total_expenses: number
  total_income: number
  documents_processed: number
  statements_processed: number
  bills_processed: number
}

export interface MonthlySpending {
  month: string
  amount: number
}

export interface CategorySpending {
  category: Category
  amount: number
}