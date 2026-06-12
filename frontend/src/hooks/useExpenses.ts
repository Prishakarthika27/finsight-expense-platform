"use client"

import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"
import { Expense } from "@/types"

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/expenses")
      setExpenses(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async (expense: {
    amount: number
    currency: string
    category: string
    description: string
    date: string
  }) => {
    await apiFetch("/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    })
    await fetchExpenses()
  }

  const updateExpense = async (
    id: string,
    expense: Partial<{
      amount: number
      currency: string
      category: string
      description: string
      date: string
    }>
  ) => {
    await apiFetch(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    })
    await fetchExpenses()
  }

  const deleteExpense = async (id: string) => {
    await apiFetch(`/expenses/${id}`, {
      method: "DELETE",
    })
    await fetchExpenses()
  }

  return { expenses, loading, error, createExpense, updateExpense, deleteExpense, refetch: fetchExpenses }
}