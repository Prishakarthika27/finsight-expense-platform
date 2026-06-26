"use client"
import { Home } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function RegisterPage() {
  
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-6 left-6">
    <Link href="/home">
      <Button variant="outline" size="icon" className="h-8 w-8">
        <Home className="h-3.5 w-3.5" />
      </Button>
    </Link>
  </div>

  <div className="absolute top-6 right-6">
    <ThemeToggle />
  </div>
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">FinSight</span>
              </div>
              <h1 className="text-xl font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to activate your account.
              </p>
              <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">
                💡 Don&apos;t see the email? Please check your <span className="font-medium">spam or junk folder</span>.
              </p>
              <Link href="/login">
                <Button className="w-full mt-2">Back to login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
   <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">FinSight</span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              AI-powered expense intelligence
            </p>
            <h1 className="text-xl font-semibold text-center pt-2">
              Create an account
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Start tracking your expenses with AI
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}