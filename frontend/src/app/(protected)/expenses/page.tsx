"use client"

import { useState, useMemo } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExpenseFormDialog } from "@/components/shared/expense-form-dialog"
import { useExpenses } from "@/hooks/useExpenses"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Expense } from "@/types"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Travel: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  Shopping: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  Bills: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  Healthcare: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  Entertainment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

const CATEGORIES = ["All", "Food", "Travel", "Shopping", "Bills", "Healthcare", "Entertainment", "Other"]

export default function ExpensesPage() {
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")

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

  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    // Search filter
    if (search.trim()) {
      result = result.filter(e =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(e => e.category === selectedCategory)
    }

    // Sort
    if (sortBy === "amount") {
      result.sort((a, b) => b.amount - a.amount)
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    return result
  }, [expenses, search, selectedCategory, sortBy])

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("All")
    setSortBy("date")
  }

  const hasFilters = search || selectedCategory !== "All" || sortBy !== "date"

  return (
    <div>
      <Topbar title="Expense Tracker" />
      <div className="p-4 md:p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? `${filteredExpenses.length} of ${expenses.length} expenses` : `${expenses.length} expenses`}
            </p>
            <p className="text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
            className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="date">Latest first</option>
            <option value="amount">Highest amount</option>
          </select>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && <p className="text-muted-foreground">Loading expenses...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}

        {/* Empty states */}
        {!loading && expenses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="text-muted-foreground">No expenses yet.</p>
              <p className="text-sm text-muted-foreground">Click &quot;Add Expense&quot; to get started.</p>
            </CardContent>
          </Card>
        )}

        {!loading && expenses.length > 0 && filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="text-muted-foreground">No expenses match your search.</p>
              <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                Clear filters
              </button>
            </CardContent>
          </Card>
        )}

        {/* Expense list */}
        {!loading && filteredExpenses.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={`${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other} shrink-0`}>
                        {expense.category}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <p className="font-semibold text-sm">{formatCurrency(expense.amount, expense.currency)}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(expense)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
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