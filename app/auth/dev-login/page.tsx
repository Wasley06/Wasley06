"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { Code } from "lucide-react"
import { devLogin } from "./actions"

export default function DevLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await devLogin(username, password)

      if (result?.error) {
        setError(result.error)
      }
    } catch (error: unknown) {
      console.error("[v0] Dev login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during authentication")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="animate-jiggle">
              <Image
                src="/tanzania-flag-waving.png"
                alt="Tanzania Flag"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <div className="w-20 h-20">
              <Image
                src="/logo.png"
                alt="Jumuiya Ya Waisilamu UK Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <div className="animate-jiggle" style={{ animationDelay: "0.2s" }}>
              <Image src="/uk-flag.png" alt="UK Flag" width={60} height={60} className="object-contain" />
            </div>
          </div>
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Developer Access</CardTitle>
              </div>
              <CardDescription>Enter dev credentials to access the developer dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Wasley@DEV"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[rgb(255,193,7)] hover:bg-[rgb(230,173,6)] dark:bg-[rgb(255,193,7)] dark:hover:bg-[rgb(230,173,6)] text-gray-900 font-semibold hover:scale-105 hover:shadow-md transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Access Dev Dashboard"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    ← Back to home
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
