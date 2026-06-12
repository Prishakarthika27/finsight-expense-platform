"use client"

import { Topbar } from "@/components/layout/topbar"
import { StatCard } from "@/components/shared/stat-card"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { formatCurrency } from "@/lib/utils"
import { Wallet, TrendingUp, FileText, FileSpreadsheet, ScanLine } from "lucide-react"

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats()

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">
        {loading && (
          <p className="text-muted-foreground">Loading dashboard...</p>
        )}

        {error && (
          <p className="text-destructive">Error: {error}</p>
        )}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Expenses"
              value={formatCurrency(stats.total_expenses)}
              icon={Wallet}
            />
            <StatCard
              label="Total Income"
              value={formatCurrency(stats.total_income)}
              icon={TrendingUp}
            />
            <StatCard
              label="Documents Processed"
              value={stats.documents_processed.toString()}
              icon={FileText}
            />
            <StatCard
              label="Statements Processed"
              value={stats.statements_processed.toString()}
              icon={FileSpreadsheet}
            />
            <StatCard
              label="Bills Processed"
              value={stats.bills_processed.toString()}
              icon={ScanLine}
            />
          </div>
        )}
      </div>
    </div>
  )
}