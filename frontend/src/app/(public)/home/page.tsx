"use client"

import Link from "next/link"
import { Wallet, ScanLine, FileBarChart, LayoutDashboard, Receipt, PenTool, FolderOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const FEATURES = [
  { icon: ScanLine, title: "Bill Scanner", desc: "OCR + AI reads your receipts automatically" },
  { icon: FileBarChart, title: "Statement Analyzer", desc: "Upload PDFs, get instant spending insights" },
  { icon: LayoutDashboard, title: "Smart Dashboard", desc: "Charts and stats that update in real time" },
  { icon: Receipt, title: "Expense Tracker", desc: "Add, edit, delete expenses with categories" },
  { icon: PenTool, title: "Digital Signature", desc: "Sign and download documents digitally" },
  { icon: FolderOpen, title: "Document Manager", desc: "All your files, secure and accessible" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 h-16 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-base font-medium">FinSight</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <Link href="/platform" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Platform
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
            Log in
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 bg-card">
        <div
          className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-primary text-xs px-3 py-1 rounded-full mb-6"
          style={{ animation: "fadeUp 0.5s ease 0.1s both" }}
        >
          AI-Powered Expense Intelligence
        </div>
        <h1
          className="text-4xl md:text-5xl font-medium max-w-2xl mx-auto leading-tight mb-4"
          style={{ animation: "fadeUp 0.6s ease 0.25s both" }}
        >
          Track, scan, and understand your spending with AI
        </h1>
        <p
          className="text-muted-foreground text-base max-w-lg mx-auto mb-8 leading-relaxed"
          style={{ animation: "fadeUp 0.6s ease 0.4s both" }}
        >
          Upload bills, analyze bank statements, and get smart insights — all in one place.
        </p>
        <div
          className="flex items-center justify-center gap-3"
          style={{ animation: "fadeUp 0.6s ease 0.55s both" }}
        >
          <Link href="/register" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Get started free
          </Link>
          <Link href="/platform" className="px-6 py-3 border border-border rounded-md text-sm hover:bg-muted transition-colors">
            See how it works →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6 bg-muted/50">
        <p className="text-center text-sm text-muted-foreground mb-10">
          Everything you need to manage your finances
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-primary hover:bg-emerald-50 dark:hover:bg-emerald-950/30 group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Icon className="h-6 w-6 text-primary mb-3 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors" />
                <p className="text-sm font-medium mb-1">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-card">
        <h2 className="text-2xl font-medium mb-2">Ready to take control of your finances?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Join FinSight today — it&apos;s free to get started.
        </p>
        <Link href="/register" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-8 flex items-center justify-between text-xs text-muted-foreground bg-card">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span>FinSight</span>
        </div>
        <p>© 2026 FinSight. All rights reserved.</p>
      </footer>

    </div>
  )
}