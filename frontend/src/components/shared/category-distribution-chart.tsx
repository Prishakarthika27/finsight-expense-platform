"use client"

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface CategoryDistributionChartProps {
  data: { category: string; amount: number }[]
}

const COLORS = ["#0F6E56", "#378ADD", "#F0997B", "#9B59B6", "#F39C12", "#E74C3C", "#1D9E75"]

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  const chartData = data.map((item, index) => ({
    name: item.category,
    amount: item.amount,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No expense data yet
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="amount"
                    cornerRadius={6}
                    background={{ fill: "hsl(var(--muted))" }}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                      fontSize: "12px",
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{formatCurrency(total)}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 shrink-0">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: item.fill }}
                  />
                  <div>
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.amount)} · {Math.round((item.amount / total) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}