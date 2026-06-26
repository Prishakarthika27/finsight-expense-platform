"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  FileBarChart,
  FolderOpen,
  PenTool,
  UserCircle,
  HelpCircle,
  LogOut,
  Wallet,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expense Tracker", icon: Receipt },
  { href: "/bill-scanner", label: "Bill Scanner", icon: ScanLine },
  { href: "/bank-statements", label: "Bank Statements", icon: FileBarChart },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/signature", label: "Signature", icon: PenTool },
]

const bottomItems = [
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/help", label: "Help Center", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState("?")

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single()
      if (data?.full_name) {
        const parts = data.full_name.split(" ")
        setInitials(parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2))
      }
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    }
    fetchProfile()

    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      setAvatarUrl(customEvent.detail.avatarUrl)
    }
    window.addEventListener("avatar-updated", handleAvatarUpdate)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const NavContent = () => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex items-center gap-2 px-4 h-16 border-b">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">FinSight</span>
        </div>
        <NavContent />
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">FinSight</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/profile">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-center justify-center text-xs font-medium">
                {initials}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold">FinSight</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavContent />
      </div>
    </>
  )
}