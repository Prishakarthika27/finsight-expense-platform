import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">FinSight</span>
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
        <Link href="/home">
          <Button>Go to Home</Button>
        </Link>
      </div>
    </div>
  )
}