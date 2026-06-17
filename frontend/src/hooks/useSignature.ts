"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { createClient } from "@/lib/supabase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export function useSignature() {
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSignature = async (dataUrl: string) => {
    setSaving(true)
    setError(null)
    try {
      const result = await apiFetch("/signature/save", {
        method: "POST",
        body: JSON.stringify({ signature_data: dataUrl }),
      })
      setSavedSignatureUrl(result.signature_url)
      return result.signature_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save signature")
      throw err
    } finally {
      setSaving(false)
    }
  }

  const signDocument = async (file: File, signatureDataUrl: string) => {
    setSigning(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature_data", signatureDataUrl)

      const response = await fetch(`${API_BASE_URL}/signature/sign-document`, {
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
        }
        throw new Error(message)
      }

      const result = await response.json()
      return result.download_url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign document"
      setError(message)
      throw err
    } finally {
      setSigning(false)
    }
  }

  return { savedSignatureUrl, saveSignature, signDocument, saving, signing, error }
}