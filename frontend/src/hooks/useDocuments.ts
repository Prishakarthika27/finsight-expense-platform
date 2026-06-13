"use client"

import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"
import { Document } from "@/types"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/documents")
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const downloadDocument = async (id: string) => {
    const result = await apiFetch(`/documents/${id}/download`)
    window.open(result.url, "_blank")
  }

  const deleteDocument = async (id: string) => {
    await apiFetch(`/documents/${id}`, { method: "DELETE" })
    await fetchDocuments()
  }

  return { documents, loading, error, downloadDocument, deleteDocument, refetch: fetchDocuments }
}