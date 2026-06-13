"use client"

import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDocuments } from "@/hooks/useDocuments"
import { formatDate } from "@/lib/utils"
import { FileText, Receipt, FileSpreadsheet, PenTool, Download, Trash2 } from "lucide-react"

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  bill: { label: "Bill", icon: Receipt, color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
  statement: { label: "Statement", icon: FileSpreadsheet, color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200" },
  signed_document: { label: "Signed", icon: PenTool, color: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200" },
  other: { label: "Other", icon: FileText, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
}

export default function DocumentsPage() {
  const { documents, loading, error, downloadDocument, deleteDocument } = useDocuments()
  const [actionId, setActionId] = useState<string | null>(null)

  const handleDownload = async (id: string) => {
    setActionId(id)
    try {
      await downloadDocument(id)
    } catch {
      alert("Failed to download document")
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    setActionId(id)
    try {
      await deleteDocument(id)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div>
      <Topbar title="Documents" />
      <div className="p-6 space-y-6">
        {loading && <p className="text-muted-foreground">Loading documents...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}

        {!loading && documents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No documents yet. Scanned bills and bank statements will appear here automatically.
            </CardContent>
          </Card>
        )}

        {!loading && documents.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {documents.map((doc) => {
                  const config = TYPE_CONFIG[doc.file_type] || TYPE_CONFIG.other
                  const Icon = config.icon
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(doc.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={config.color}>{config.label}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc.id)}
                          disabled={actionId === doc.id}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          disabled={actionId === doc.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}