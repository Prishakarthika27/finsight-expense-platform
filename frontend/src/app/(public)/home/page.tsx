"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Wallet, ScanLine, FileBarChart, LayoutDashboard, Receipt, PenTool, FolderOpen, BarChart2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const FEATURES = [
  { icon: ScanLine, title: "Bill Scanner", desc: "OCR + AI reads your receipts and auto-creates expenses" },
  { icon: FileBarChart, title: "Statement Analyzer", desc: "Upload bank PDFs and get instant spending insights" },
  { icon: LayoutDashboard, title: "Smart Dashboard", desc: "Real-time charts and stats that update automatically" },
  { icon: Receipt, title: "Expense Tracker", desc: "Add, edit, delete expenses with smart categories" },
  { icon: PenTool, title: "Digital Signature", desc: "Draw your signature and embed it into any PDF" },
  { icon: FolderOpen, title: "Document Manager", desc: "All your bills, statements and signed docs in one place" },
]

const STEPS = [
  { num: "1", title: "Upload", desc: "Snap a bill photo or upload your bank statement PDF" },
  { num: "2", title: "AI Analyzes", desc: "Our AI extracts amounts, dates, and categorizes spending" },
  { num: "3", title: "Get Insights", desc: "View charts, track trends, and download reports" },
]

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.15 }
    )
    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 md:px-8 h-14 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">FinSight</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <Link href="/platform" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</Link>
        </div>

        {/* Mobile nav - icons */}
        <div className="flex md:hidden items-center gap-4">
          <a href="#features" className="text-muted-foreground hover:text-primary transition-colors" title="Features">
            <ScanLine className="h-5 w-5" />
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors" title="How it works">
            <BarChart2 className="h-5 w-5" />
          </a>
          <Link href="/platform" className="text-muted-foreground hover:text-primary transition-colors" title="Platform">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            Log in
          </Link>
          <Link href="/register" className="hidden md:block text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 bg-card">
        <div
          className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          style={{ animation: "fadeUp 0.5s ease 0.1s both" }}
        >
          ✨ AI-Powered Expense Intelligence
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto leading-tight mb-5 tracking-tight"
          style={{ animation: "fadeUp 0.6s ease 0.25s both" }}
        >
          Track, scan, and understand your spending with AI
        </h1>
        <p
          className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed"
          style={{ animation: "fadeUp 0.6s ease 0.4s both" }}
        >
          Upload bills, analyze bank statements, and get smart insights — all in one beautifully designed platform.
        </p>
        <div
          className="flex items-center justify-center gap-3 flex-wrap"
          style={{ animation: "fadeUp 0.6s ease 0.55s both" }}
        >
          <Link href="/register" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
            Get started free →
          </Link>
          <a href="#how-it-works" className="px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            See how it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-6 bg-muted/50 border-t border-border">
        <p className="animate-on-scroll text-center text-xs font-semibold text-primary uppercase tracking-widest mb-2">How it works</p>
        <h2 className="animate-on-scroll text-center text-2xl font-semibold mb-12">Three simple steps</h2>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={i} className="animate-on-scroll flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">
                {step.num}
              </div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6 bg-card border-t border-border">
        <p className="animate-on-scroll text-center text-xs font-semibold text-primary uppercase tracking-widest mb-2">Features</p>
        <h2 className="animate-on-scroll text-center text-2xl font-semibold mb-12">Everything you need in one place</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div key={i} className="animate-on-scroll bg-background border border-border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:border-primary hover:bg-emerald-50 dark:hover:bg-emerald-950/30 group">
                <Icon className="h-6 w-6 text-primary mb-3 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors" />
                <p className="text-sm font-semibold mb-1">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-muted/50 border-t border-border">
        <h2 className="animate-on-scroll text-2xl font-semibold mb-3">Ready to take control of your finances?</h2>
        <p className="animate-on-scroll text-sm text-muted-foreground mb-8">
          Join FinSight today — free to get started, no credit card required.
        </p>
        <div className="animate-on-scroll">
          <Link href="/register" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
            Get started free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-5 px-8 flex items-center justify-between text-xs text-muted-foreground bg-card">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="font-medium">FinSight</span>
        </div>
        <p>© 2026 FinSight. All rights reserved.</p>
      </footer>

    </div>
  )
}