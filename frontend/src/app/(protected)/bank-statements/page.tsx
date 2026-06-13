"use client"

import { useState, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStatementAnalyzer } from "@/hooks/useStatementAnalyzer"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { Upload, FileText, CheckCircle2, Loader2, Download } from "lucide-react"

const STEPS = [
  "Reading PDF",
  "Extracting transactions",
  "Categorizing",
  "Generating insights",
]

export default function BankStatementsPage() {
  const { analyzeStatement, loading, error, result, step } = useStatementAnalyzer()
  const [fileName, setFileName] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      await analyzeStatement(file)
    } catch {
      // error handled in hook
    } finally {
      e.target.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const filteredTransactions = result?.transactions.filter((t) => {
    if (filter === "all") return true
    return t.type === filter
  })

  const downloadCSV = () => {
    if (!result) return
    const headers = ["Date", "Description", "Amount", "Type", "Category"]
    const rows = result.transactions.map((t) => [t.date, t.description, t.amount, t.type, t.category])
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Topbar title="Bank Statement Analyzer" />
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground max-w-2xl">
          Upload a PDF bank statement downloaded from your bank&apos;s internet banking portal. We&apos;ll extract transactions and generate spending insights.
        </p>

        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {!loading ? (
              <button
                onClick={handleClick}
                className="w-full border-2 border-dashed border-border rounded-lg py-12 flex flex-col items-center gap-3 hover:border-primary hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Click to upload bank statement</p>
                <p className="text-sm text-muted-foreground">PDF only, max 10MB</p>
              </button>
            ) : (
              <div className="py-8 space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                  {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      {step > i ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={cn(step > i ? "text-foreground" : "text-muted-foreground")}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fileName && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {fileName}
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="max-w-2xl">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {formatCurrency(result.insights.total_income)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Expense</p>
                  <p className="text-xl font-semibold text-red-600">
                    {formatCurrency(result.insights.total_expense)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Net Savings</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(result.insights.net_savings)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Top Category</p>
                  <p className="text-xl font-semibold">
                    {result.insights.top_category || "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                {(["all", "credit", "debit"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-colors",
                      filter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {f === "all" ? "All" : f === "credit" ? "Credits" : "Debits"}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Description</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions?.map((t, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="p-3">{t.description}</td>
                        <td
                          className={cn(
                            "p-3 font-medium whitespace-nowrap",
                            t.type === "credit" ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {t.type === "credit" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="p-3">
                          <Badge variant={t.type === "credit" ? "default" : "secondary"}>
                            {t.type}
                          </Badge>
                        </td>
                        <td className="p-3">{t.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}