"use client"

import { Topbar } from "@/components/layout/topbar"
import { StatCard } from "@/components/shared/stat-card"
import { MonthlySpendingChart } from "@/components/shared/monthly-spending-chart"
import { CategoryDistributionChart } from "@/components/shared/category-distribution-chart"
import { IncomeExpenseChart } from "@/components/shared/income-expense-chart"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useChartsData } from "@/hooks/useChartsData"
import { formatCurrency } from "@/lib/utils"
import { Wallet, TrendingUp, FileText, FileSpreadsheet, ScanLine } from "lucide-react"

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { data: chartsData, loading: chartsLoading, error: chartsError } = useChartsData()

  return (
     <div>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">
        
        {statsLoading && (
          <p className="text-muted-foreground">Loading dashboard...</p>
        )}

        {statsError && (
          <p className="text-destructive">Error: {statsError}</p>
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

        {chartsLoading && (
          <p className="text-muted-foreground">Loading charts...</p>
        )}

        {chartsError && (
          <p className="text-destructive">Error: {chartsError}</p>
        )}

        {chartsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlySpendingChart data={chartsData.monthly_spending} />
            <CategoryDistributionChart data={chartsData.category_distribution} />
            <div className="lg:col-span-2">
              <IncomeExpenseChart data={chartsData.income_vs_expense} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}