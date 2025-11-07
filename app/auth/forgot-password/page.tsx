"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setEmailSent(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-md">
          <Card className="border border-border shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-[rgb(25,135,84)]" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Please check your email and click the link to reset your password. The link will expire in 1 hour.
              </p>
              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                  ← Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-md">
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white font-semibold text-base hover:scale-105 hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                  ← Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
