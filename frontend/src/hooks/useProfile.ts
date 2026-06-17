"use client"

import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string | null
  created_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/profile")
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    const updated = await apiFetch("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    setProfile(updated)
    return updated
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}