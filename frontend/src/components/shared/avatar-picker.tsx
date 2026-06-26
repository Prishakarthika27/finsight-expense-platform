"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESET_AVATARS = [
  { id: "1", emoji: "🧑", bg: "#E1F5EE" },
  { id: "2", emoji: "👩", bg: "#FEF3C7" },
  { id: "3", emoji: "🧔", bg: "#EDE9FE" },
  { id: "4", emoji: "👱‍♀️", bg: "#FCE7F3" },
  { id: "5", emoji: "🧕", bg: "#DBEAFE" },
  { id: "6", emoji: "👨‍💼", bg: "#D1FAE5" },
  { id: "7", emoji: "👩‍💼", bg: "#FEE2E2" },
  { id: "8", emoji: "🧑‍💻", bg: "#F3F4F6" },
  { id: "9", emoji: "👩‍💻", bg: "#FEF9C3" },
  { id: "10", emoji: "🦊", bg: "#ECFDF5" },
  { id: "11", emoji: "🐼", bg: "#EFF6FF" },
  { id: "12", emoji: "🦁", bg: "#FDF4FF" },
]

interface AvatarPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPreset: (emoji: string, bg: string) => void
  onUploadFile: (file: File) => void
  currentAvatarUrl?: string | null
}

export function AvatarPicker({ open, onOpenChange, onSelectPreset, onUploadFile }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePresetClick = (avatar: typeof PRESET_AVATARS[0]) => {
    setSelected(avatar.id)
  }

  const handleSave = () => {
    if (selected) {
      const avatar = PRESET_AVATARS.find(a => a.id === selected)
      if (avatar) {
        onSelectPreset(avatar.emoji, avatar.bg)
      }
    }
    onOpenChange(false)
    setSelected(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadFile(file)
      onOpenChange(false)
      setSelected(null)
    }
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Preset avatars
            </p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handlePresetClick(avatar)}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-xl transition-all duration-200 border-2",
                    selected === avatar.id
                      ? "border-primary scale-110 shadow-md"
                      : "border-transparent hover:border-primary hover:scale-110"
                  )}
                  style={{ background: avatar.bg }}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Or upload your own
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP — max 2MB</p>
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { onOpenChange(false); setSelected(null) }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selected}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}