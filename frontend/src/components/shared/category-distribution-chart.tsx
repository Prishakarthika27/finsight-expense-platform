"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CategoryDistributionChartProps {
  data: { category: string; amount: number }[]
}

const COLORS = ["#0F6E56", "#1D9E75", "#5DCAA5", "#9FE1CB", "#378ADD", "#85B7EB", "#F0997B"]

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
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
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props: Record<string, number>) =>
                  `${props.category} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}