"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Megaphone, TrendingUp, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MembersTable } from "./members-table"
import { ContributionsTable } from "./contributions-table"
import { AnnouncementsManager } from "./announcements-manager"
import { DevSection } from "./dev-section"

interface AdminDashboardProps {
  members: any[]
  contributions: any[]
  announcements: any[]
  admin: {
    username: string
    full_name: string | null
    role: string
  }
}

export default function AdminDashboard({ members, contributions, announcements, admin }: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("members")

  const activeMembers = members.filter((m) => m.membership_status === "active").length
  const pendingMembers = members.filter((m) => m.membership_status === "pending").length
  const totalContributions = contributions.reduce((sum, c) => sum + (Number.parseFloat(c.amount) || 0), 0)
  const publishedAnnouncements = announcements.filter((a) => a.published).length

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary font-logo">Jumuiya Ya Waisilamu UK</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{admin.full_name || admin.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{admin.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{members.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeMembers} active, {pendingMembers} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">£{totalContributions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{contributions.length} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{announcements.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{publishedAnnouncements} published</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Community Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Excellent</div>
              <p className="text-xs text-muted-foreground mt-1">
                {members.length > 0 ? ((activeMembers / members.length) * 100).toFixed(0) : 0}% active rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="dev">
              <Settings className="h-4 w-4 mr-2" />
              DEV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Member Management</CardTitle>
                <CardDescription>View and manage all community members</CardDescription>
              </CardHeader>
              <CardContent>
                <MembersTable members={members} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contribution Tracking</CardTitle>
                <CardDescription>Monitor member contributions and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <ContributionsTable contributions={contributions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Announcements Management</CardTitle>
                <CardDescription>Create and manage community announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <AnnouncementsManager announcements={announcements} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dev" className="space-y-4">
            <DevSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
