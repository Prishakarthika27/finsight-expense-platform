"use client"
import { BudgetAlert } from "@/components/shared/budget-alert"
import { Topbar } from "@/components/layout/topbar"
import { MonthlySpendingChart } from "@/components/shared/monthly-spending-chart"
import { CategoryDistributionChart } from "@/components/shared/category-distribution-chart"
import { IncomeExpenseChart } from "@/components/shared/income-expense-chart"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useChartsData } from "@/hooks/useChartsData"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency } from "@/lib/utils"
import { Wallet, TrendingUp, PiggyBank, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function StatCard({ label, value, icon: Icon, valueColor }: {
  label: string
  value: string
  icon: React.ElementType
  valueColor?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={`text-xl font-semibold ${valueColor || ""}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useDashboardStats()
  const { data: chartsData, loading: chartsLoading } = useChartsData()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState("")

  useEffect(() => {
    const fetchName = async () => {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
      if (data?.full_name) {
        setFirstName(data.full_name.split(" ")[0])
      }
    }
    fetchName()
  }, [user])

  const savingsRate = stats && stats.total_income > 0
    ? Math.round(((stats.total_income - stats.total_expenses) / stats.total_income) * 100)
    : 0

  const topCategory = chartsData?.category_distribution?.length
    ? chartsData.category_distribution.reduce((a, b) => a.amount > b.amount ? a : b).category
    : "N/A"

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-4 md:p-6 space-y-6">

        {/* Welcome */}
        <div>
          <h2 className="text-xl font-semibold">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your financial overview
          </p>
        </div>

        {/* Stat cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Expenses"
              value={formatCurrency(stats.total_expenses)}
              icon={Wallet}
              valueColor="text-destructive"
            />
            <StatCard
              label="Total Income"
              value={formatCurrency(stats.total_income)}
              icon={TrendingUp}
              valueColor="text-emerald-600"
            />
            <StatCard
              label="Savings Rate"
              value={`${savingsRate}%`}
              icon={PiggyBank}
              valueColor="text-emerald-600"
            />
            <StatCard
              label="Top Category"
              value={topCategory}
              icon={Tag}
            />
          </div>
        )}

        {/* Budget Alert */}
        {stats && (
          <BudgetAlert totalExpenses={stats.total_expenses} />
        )}

        {/* Charts row */}
        {chartsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : chartsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlySpendingChart data={chartsData.monthly_spending} />
            <CategoryDistributionChart data={chartsData.category_distribution} />
          </div>
        )}

        {/* Income vs Expense full width */}
        {chartsData && !chartsLoading && (
          <IncomeExpenseChart data={chartsData.income_vs_expense} />
        )}

      </div>
    </div>
  )
}