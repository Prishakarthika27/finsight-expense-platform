import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  iconColor?: string
}

export function StatCard({ label, value, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            iconColor || "bg-emerald-50 dark:bg-emerald-950/40"
          )}
        >
          <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
      </CardContent>
    </Card>
  )
}