"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useBudget } from "@/hooks/useBudget"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetAlertProps {
  totalExpenses: number
}

function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2)

    gainNode.gain.setValueAtTime(1.0, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.0)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 1.0)
  } catch {
    // Sound not supported
  }
}

export function BudgetAlert({ totalExpenses }: BudgetAlertProps) {
  const { budget, loading, saving, saveBudget } = useBudget()
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (budget > 0) setInputValue(budget.toString())
  }, [budget])

  const percentage = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0
  const isWarning = percentage >= 80 && percentage < 100
  const isOver = percentage >= 100

  const checkBudgetAlert = () => {
    if (budget <= 0) return
    if (isOver) {
      playAlertSound()
      toast.error("⚠️ Budget Exceeded!", {
        description: `You've spent ${formatCurrency(totalExpenses)} — ${formatCurrency(totalExpenses - budget)} over your budget!`,
        duration: 5000,
      })
    } else if (isWarning) {
      playAlertSound()
      toast.warning("⚠️ Approaching Budget Limit!", {
        description: `You've used ${percentage}% of your ${formatCurrency(budget)} monthly budget.`,
        duration: 8000,
      })
    }
  }
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const handleSave = async () => {
    const amount = parseFloat(inputValue)
    if (isNaN(amount) || amount <= 0) return
    const success = await saveBudget(amount)
    if (success) {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Check budget alert after saving
      setTimeout(() => checkBudgetAlert(), 500)
    }
  }
  if (loading) return null

  const progressColor = isOver
    ? "bg-destructive"
    : isWarning
    ? "bg-amber-500"
    : "bg-primary"

  const cardBorder = isOver
    ? "border-destructive/50 bg-destructive/5"
    : isWarning
    ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
    : ""

  return (
    <Card className={cn("transition-all duration-300", cardBorder)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Monthly Budget</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:underline"
            >
              {budget > 0 ? "Edit" : "Set budget"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Enter monthly budget"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : budget === 0 ? (
          <p className="text-xs text-muted-foreground">
            Set a monthly budget to track your spending limits
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalExpenses)} spent</span>
              <span>{formatCurrency(budget)} budget</span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-medium",
                isOver ? "text-destructive" : isWarning ? "text-amber-600" : "text-primary"
              )}>
                {percentage}% used
              </span>
              {isOver ? (
                <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Over budget by {formatCurrency(totalExpenses - budget)}!
                </div>
              ) : isWarning ? (
                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Approaching limit!
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  {formatCurrency(budget - totalExpenses)} remaining
                </div>
              )}
            </div>
          </div>
        )}

        {saved && (
          <p className="text-xs text-emerald-600 mt-2">Budget saved successfully!</p>
        )}
      </CardContent>
    </Card>
  )
}