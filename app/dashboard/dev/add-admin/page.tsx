"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddAdminPage() {
  const [members, setMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "member")
        .order("first_name", { ascending: true })

      if (data) {
        setMembers(data)
      }
    }
    fetchMembers()
  }, [])

  const handlePromoteToAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", selectedMember)

      if (updateError) throw updateError

      setSuccess("Member promoted to admin successfully!")
      setTimeout(() => {
        router.push("/dashboard/dev")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <Link href="/dashboard/dev">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dev Dashboard
          </Button>
        </Link>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Add Admin</CardTitle>
            <CardDescription>Promote a member to administrator role</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePromoteToAdmin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="member">
                  Select Member <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedMember} onValueChange={setSelectedMember} required>
                  <SelectTrigger id="member">
                    <SelectValue placeholder="Choose a member to promote" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.surname} - {member.email || member.mobile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading || !selectedMember}
              >
                {isLoading ? "Promoting..." : "Promote to Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
