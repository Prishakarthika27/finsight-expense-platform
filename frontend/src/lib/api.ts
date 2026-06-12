import { createClient } from "@/lib/supabase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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

  return response.json()
}