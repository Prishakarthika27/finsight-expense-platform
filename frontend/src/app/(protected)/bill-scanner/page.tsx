"use client"

import { useState, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBillScanner } from "@/hooks/useBillScanner"
import { formatCurrency } from "@/lib/utils"
import { Upload, ScanLine, CheckCircle2, FileText } from "lucide-react"

export default function BillScannerPage() {
  const { scanBill, loading, error, result } = useBillScanner()
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }

   try {
      await scanBill(file)
    } catch {
      // error is handled in hook
    } finally {
      e.target.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <Topbar title="Bill Scanner" />
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          Upload a photo or PDF of your bill/receipt. We&apos;ll automatically extract the amount, merchant, and date — and add it to your expenses.
        </p>

        <Card>
          <CardContent className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleClick}
              disabled={loading}
              className="w-full border-2 border-dashed border-border rounded-lg py-12 flex flex-col items-center gap-3 hover:border-primary hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ScanLine className="h-10 w-10 text-primary animate-pulse" />
                  <p className="font-medium">Scanning your bill...</p>
                  <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Click to upload a bill</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, or PDF</p>
                </>
              )}
            </button>

            {fileName && !loading && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {fileName}
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-destructive text-sm">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {preview && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Receipt preview" className="max-h-64 rounded-md border" />
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  {result.expense_id ? "Expense created successfully!" : "Scan complete"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {result.scan_result.amount !== null
                      ? formatCurrency(result.scan_result.amount)
                      : "Not detected"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Merchant</p>
                  <p className="font-semibold">{result.scan_result.merchant || "Not detected"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">{result.scan_result.date || "Not detected"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <Badge>{result.scan_result.category}</Badge>
                </div>
              </div>

              {!result.expense_id && (
                <p className="text-sm text-muted-foreground">
                  Couldn&apos;t auto-create an expense (amount not detected). You can add it manually in Expense Tracker.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}