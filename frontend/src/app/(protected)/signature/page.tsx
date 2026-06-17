"use client"

import { useState, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignatureCanvasComponent } from "@/components/shared/signature-canvas"
import { useSignature } from "@/hooks/useSignature"
import { Upload, FileText, CheckCircle2, Download } from "lucide-react"

export default function SignaturePage() {
  const { savedSignatureUrl, saveSignature, signDocument, saving, signing, error } = useSignature()
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveSignature = async (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    try {
      await saveSignature(dataUrl)
    } catch {
      // error handled in hook
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPdfFile(file)
      setDownloadUrl(null)
    }
  }

  const handleSignDocument = async () => {
    if (!pdfFile || !signatureDataUrl) return
    try {
      const url = await signDocument(pdfFile, signatureDataUrl)
      setDownloadUrl(url)
    } catch {
      // error handled in hook
    }
  }

  return (
    <div>
      <Topbar title="Digital Signature" />
      <div className="p-6 space-y-6 max-w-2xl">
        <p className="text-muted-foreground">
          Draw your signature, then upload a PDF document to sign and download it.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Step 1: Draw Your Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCanvasComponent onSave={handleSaveSignature} />
            {saving && <p className="text-sm text-muted-foreground mt-2">Saving signature...</p>}
            {signatureDataUrl && !saving && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Signature saved
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Step 2: Upload Document to Sign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!signatureDataUrl}
              className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 hover:border-primary hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-sm">
                {pdfFile ? pdfFile.name : "Click to upload a PDF"}
              </p>
            </button>

            {!signatureDataUrl && (
              <p className="text-xs text-muted-foreground">Draw and save your signature first</p>
            )}

            <Button
              onClick={handleSignDocument}
              disabled={!pdfFile || !signatureDataUrl || signing}
              className="w-full"
            >
              {signing ? "Signing document..." : "Sign Document"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {downloadUrl && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium text-sm">Document signed successfully!</p>
              </div>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}