"use client"

import Link from "next/link"
import { Wallet, Shield, Zap, Brain, FileText, BarChart3, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useRef } from "react"

const HOW_IT_WORKS = [
  {
    icon: Zap,
    title: "Instant Bill Scanning",
    desc: "Take a photo of any receipt or bill. Our OCR engine reads the text, and our AI extracts the amount, merchant name, date, and category automatically — creating an expense entry without any manual input.",
  },
  {
    icon: Brain,
    title: "AI-Powered Categorization",
    desc: "Every transaction is analyzed by our Groq-powered AI model. It understands context — 'Swiggy' becomes Food, 'Uber' becomes Travel — so your expense reports are always accurate and meaningful.",
  },
  {
    icon: FileText,
    title: "Bank Statement Analysis",
    desc: "Upload a PDF bank statement from any major Indian bank. FinSight parses every transaction row, classifies credits and debits, and generates a complete spending breakdown with visual insights.",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    desc: "Your dashboard updates instantly whenever you add an expense or upload a statement. See monthly spending trends, category breakdowns, and income vs expense charts — all in real time.",
  },
  {
    icon: Shield,
    title: "Bank-grade Security",
    desc: "Every file is stored in private, encrypted Supabase Storage buckets. Documents are served via signed URLs that expire after 1 hour. Row Level Security ensures users can only access their own data.",
  },
  {
    icon: Lock,
    title: "Digital Signatures",
    desc: "Draw your signature on any device and embed it into a PDF document. The signed document is stored securely and available for download anytime from your Documents page.",
  },
]

export default function PlatformPage() {
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
      <nav className="grid grid-cols-3 items-center px-8 h-14 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">FinSight</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <Link href="/home#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/home#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="/platform" className="text-sm font-medium text-foreground transition-colors">
            Platform
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            Log in
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 bg-card border-b border-border">
        <div
          className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          style={{ animation: "fadeUp 0.5s ease 0.1s both" }}
        >
          How FinSight works
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto leading-tight mb-4 tracking-tight"
          style={{ animation: "fadeUp 0.6s ease 0.25s both" }}
        >
          A smarter way to manage your finances
        </h1>
        <p
          className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed"
          style={{ animation: "fadeUp 0.6s ease 0.4s both" }}
        >
          FinSight combines OCR, AI, and real-time data processing to give you a complete picture of your spending — automatically.
        </p>
      </section>

      {/* How it works detail */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className={`animate-on-scroll animate-delay-${(i % 3) + 1} bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-md transition-all duration-300`}
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-6 bg-muted/50 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="animate-on-scroll text-xs font-semibold text-primary uppercase tracking-widest mb-2">Built with</p>
          <h2 className="animate-on-scroll animate-delay-1 text-2xl font-semibold mb-10">Modern, production-grade technology</h2>
          <div className="animate-on-scroll animate-delay-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Next.js 14", desc: "Frontend" },
              { name: "FastAPI", desc: "Backend" },
              { name: "Supabase", desc: "Database & Auth" },
              { name: "Groq AI", desc: "AI Categorization" },
              { name: "Tesseract", desc: "OCR Engine" },
              { name: "PyMuPDF", desc: "PDF Processing" },
              { name: "Recharts", desc: "Data Visualization" },
              { name: "Tailwind CSS", desc: "Styling" },
            ].map((tech) => (
              <div key={tech.name} className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-primary">{tech.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-card border-t border-border">
        <h2 className="animate-on-scroll text-2xl font-semibold mb-3">Ready to get started?</h2>
        <p className="animate-on-scroll animate-delay-1 text-sm text-muted-foreground mb-8">
          Join FinSight today — free to use, no credit card required.
        </p>
        <div className="animate-on-scroll animate-delay-2 flex items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Get started free →
          </Link>
          <Link href="/home" className="px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            ← Back to home
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