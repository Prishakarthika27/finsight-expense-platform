"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface TransactionItem {
  date: string
  description: string
  amount: number
  type: "credit" | "debit"
  category: string
}

export interface StatementInsights {
  total_income: number
  total_expense: number
  net_savings: number
  top_category: string | null
}

export interface StatementAnalysisResponse {
  statement_id: string
  transactions: TransactionItem[]
  insights: StatementInsights
}

export function useStatementAnalyzer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StatementAnalysisResponse | null>(null)
  const [step, setStep] = useState(0)

  const analyzeStatement = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setStep(0)

    // Simulate progress steps
    const stepTimers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2200),
    ]

    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/statements/analyze`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let message = `Request failed with status ${response.status}`
        if (typeof errorData.detail === "string") {
          message = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          message = errorData.detail.map((e: any) => e.msg).join(", ")
        }
        throw new Error(message)
      }

      const data2: StatementAnalysisResponse = await response.json()
      setStep(4)
      setResult(data2)
      return data2
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze statement"
      setError(message)
      throw err
    } finally {
      stepTimers.forEach(clearTimeout)
      setLoading(false)
    }
  }

  return { analyzeStatement, loading, error, result, step }
}