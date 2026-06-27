"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface IncomeExpenseChartProps {
  data: { month: string; income: number; expense: number }[]
}

function getSavingsStatus(rate: number) {
  if (rate >= 70) return { label: "🎉 Excellent Savings Rate!", color: "#0F6E56", bg: "#E1F5EE" }
  if (rate >= 50) return { label: "👍 Good Savings Rate!", color: "#1D9E75", bg: "#D1FAE5" }
  if (rate >= 30) return { label: "⚠️ Fair Savings Rate", color: "#F39C12", bg: "#FEF3C7" }
  return { label: "🚨 Low Savings Rate", color: "#E74C3C", bg: "#FEE2E2" }
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0)
  const totalSaved = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0
  const status = getSavingsStatus(savingsRate)

  const cx = 100
  const cy = 95
  const r = 70
  const angle = -180 + (savingsRate / 100) * 180
  const radian = (angle * Math.PI) / 180
  const needleX = cx + r * Math.cos(radian)
  const needleY = cy + r * Math.sin(radian)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Income vs Expense</CardTitle>
      </CardHeader>
      <CardContent>
        {totalIncome === 0 && totalExpense === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No statement data yet
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 200 115"
              className="w-full max-w-[220px]"
              style={{ aspectRatio: "200/115" }}
            >
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E74C3C" stopOpacity="0.9"/>
                  <stop offset="35%" stopColor="#F39C12" stopOpacity="0.9"/>
                  <stop offset="65%" stopColor="#1D9E75" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#0F6E56" stopOpacity="0.9"/>
                </linearGradient>
              </defs>

              {/* Background track */}
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round"/>

              {/* Gradient arc */}
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.8"/>

              {/* Active arc */}
              <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${needleX} ${needleY}`}
                fill="none" stroke="#0F6E56" strokeWidth="14" strokeLinecap="round"/>

              {/* Labels */}
              <text x={cx - r - 4} y={cy + 14} fontSize="8" fill="#E74C3C" fontWeight="700">0%</text>
              <text x={cx} y={cy - r - 6} fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="middle">50%</text>
              <text x={cx + r + 4} y={cy + 14} fontSize="8" fill="#0F6E56" fontWeight="700" textAnchor="end">100%</text>

              {/* Needle - now extends slightly past the arc for visibility */}

              <line x1={cx} y1={cy} x2={cx + (r + 10) * Math.cos(radian)} y2={cy + (r + 10) * Math.sin(radian)}
              stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx={cx} cy={cy} r="6" fill="hsl(var(--card))" stroke="#0F6E56" strokeWidth="2.5"/>
              <circle cx={cx} cy={cy} r="2.5" fill="#0F6E56"/> 
            </svg>

            {/* Value */}
            <div className="text-center mt-1">
              <p className="text-3xl font-extrabold text-primary">{savingsRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Savings Rate</p>
              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: status.bg, color: status.color }}>
                {status.label}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">💰 Income</p>
                <p className="text-xs font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">💸 Spent</p>
                <p className="text-xs font-bold text-destructive">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">🏦 Saved</p>
                <p className="text-xs font-bold text-blue-500">{formatCurrency(Math.max(totalSaved, 0))}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}