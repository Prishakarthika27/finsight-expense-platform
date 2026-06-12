"use client"

import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExpenseFormDialog } from "@/components/shared/expense-form-dialog"
import { useExpenses } from "@/hooks/useExpenses"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Expense } from "@/types"
import { Plus, Pencil, Trash2 } from "lucide-react"

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Travel: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  Shopping: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  Bills: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  Healthcare: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  Entertainment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export default function ExpensesPage() {
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddNew = () => {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return
    setDeletingId(id)
    try {
      await deleteExpense(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (data: {
    amount: number
    currency: string
    category: string
    description: string
    date: string
  }) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data)
    } else {
      await createExpense(data)
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <Topbar title="Expense Tracker" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total spent</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {loading && <p className="text-muted-foreground">Loading expenses...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}

        {!loading && expenses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No expenses yet. Click &quot;Add Expense&quot; to get started.
            </CardContent>
          </Card>
        )}

        {!loading && expenses.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}>
                        {expense.category}
                      </Badge>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{formatCurrency(expense.amount, expense.currency)}</p>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        onSubmit={handleSubmit}
      />
    </div>
  )
}