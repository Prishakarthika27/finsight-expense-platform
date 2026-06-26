"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/theme-toggle"
import { getInitials } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserCircle, LogOut } from "lucide-react"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()

      if (data?.full_name) setFullName(data.full_name)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    }
    fetchProfile()

    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      setAvatarUrl(customEvent.detail.avatarUrl)
    }
    window.addEventListener("avatar-updated", handleAvatarUpdate)
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdate)
    }
  }, [user])
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="hidden md:flex h-16 border-b bg-card items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="focus:outline-none"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover border-2 border-border hover:border-primary transition-colors"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-center justify-center text-sm font-medium hover:border-primary border-2 border-transparent transition-colors">
                {fullName ? getInitials(fullName) : "?"}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{fullName}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}