"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface BillScanResult {
  extracted_text: string
  amount: number | null
  merchant: string | null
  date: string | null
  category: string
}

interface BillScanResponse {
  scan_result: BillScanResult
  expense_id: string | null
}

export function useBillScanner() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BillScanResponse | null>(null)

  const scanBill = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/bills/scan`, {
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
         message = errorData.detail.map((e: {msg: string}) => e.msg).join(", ")
        }
        throw new Error(message)
      }

      const data2: BillScanResponse = await response.json()
      setResult(data2)
      return data2
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to scan bill"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { scanBill, loading, error, result }
}