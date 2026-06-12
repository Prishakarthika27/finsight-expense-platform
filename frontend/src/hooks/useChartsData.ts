"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

interface MonthlySpendingItem {
  month: string
  amount: number
}

interface CategorySpendingItem {
  category: string
  amount: number
}

interface IncomeVsExpenseItem {
  month: string
  income: number
  expense: number
}

interface ChartsData {
  monthly_spending: MonthlySpendingItem[]
  category_distribution: CategorySpendingItem[]
  income_vs_expense: IncomeVsExpenseItem[]
}

export function useChartsData() {
  const [data, setData] = useState<ChartsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await apiFetch("/charts/data")
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { data, loading, error }
}