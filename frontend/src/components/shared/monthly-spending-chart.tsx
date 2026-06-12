"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MonthlySpendingChartProps {
  data: { month: string; amount: number }[]
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No expense data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
               formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
              />
              <Bar dataKey="amount" fill="#0F6E56" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}