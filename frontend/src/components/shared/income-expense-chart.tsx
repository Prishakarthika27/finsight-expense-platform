"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface IncomeExpenseChartProps {
  data: { month: string; income: number; expense: number }[]
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Income vs Expense</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No statement data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#D85A30" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}