"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/theme-toggle"
import { getInitials } from "@/lib/utils"
import { createClient } from "@/lib/supabase"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState<string>("")

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      if (data?.full_name) {
        setFullName(data.full_name)
      }
    }
    fetchProfile()
  }, [user])

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-center justify-center text-sm font-medium">
          {fullName ? getInitials(fullName) : "?"}
        </div>
      </div>
    </header>
  )
}
