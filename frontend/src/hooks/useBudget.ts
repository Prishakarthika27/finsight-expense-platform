import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api"

interface Budget {
  monthly_budget: number
}

export function useBudget() {
  const [budget, setBudget] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchBudget = useCallback(async () => {
    try {
      const data = await apiFetch<Budget>("/budget")
      setBudget(data.monthly_budget)
    } catch {
      setError("Failed to load budget")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const saveBudget = async (amount: number) => {
    setSaving(true)
    setError("")
    try {
      const data = await apiFetch<Budget>("/budget", {
        method: "POST",
        body: JSON.stringify({ monthly_budget: amount }),
      })
      setBudget(data.monthly_budget)
      return true
    } catch {
      setError("Failed to save budget")
      return false
    } finally {
      setSaving(false)
    }
  }

  return { budget, loading, saving, error, saveBudget, refetch: fetchBudget }
}