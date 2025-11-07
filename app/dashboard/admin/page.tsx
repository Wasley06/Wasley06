import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserWithRole } from "@/lib/auth-helpers"
import { Users, Bell, DollarSign, Heart, Settings, BarChart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { getTimeBasedGreeting, formatUserName } from "@/lib/greeting-utils"

export default async function AdminDashboardPage() {
  const { user, profile, role } = await getUserWithRole()

  if (!user) {
    redirect("/auth/login")
  }

  if (role !== "admin" && role !== "dev") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const { count: memberCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: announcementCount } = await supabase.from("announcements").select("*", { count: "exact", head: true })
  const { data: recentMembers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const greeting = getTimeBasedGreeting()
  const userName = formatUserName(profile?.title, profile?.first_name, profile?.surname)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 items-center">
              <div className="w-6 h-6 relative animate-wave" style={{ animationDelay: "0s" }}>
                <Image src="/tanzania-flag-waving.png" alt="Tanzania Flag" fill className="object-contain" />
              </div>
              <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="Jumuiya Ya Waisilamu UK Logo" fill className="object-contain" />
              </div>
              <div className="w-6 h-6 relative animate-wave" style={{ animationDelay: "0.1s" }}>
                <Image src="/uk-flag.png" alt="UK Flag" fill className="object-contain" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-normal text-foreground">
                {greeting},{" "}
                <span className="font-bold text-[rgb(25,135,84)] dark:text-[rgb(40,167,69)]">{userName}</span>
              </h1>
              <Badge className="bg-[rgb(255,193,7)] text-gray-900 hover:bg-[rgb(230,173,6)]">
                {role === "dev" ? "Developer" : "Admin"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="yellow" />
            <form action="/auth/signout" method="post">
              <Button
                variant="outline"
                className="border-[rgb(220,53,69)] text-[rgb(220,53,69)] hover:bg-[rgb(220,53,69)] hover:text-white hover:scale-105 hover:shadow-md transition-all duration-200 bg-transparent"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-2 border-primary/20 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberCount || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Bell className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcementCount || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£0</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Cases</CardTitle>
              <Heart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link href="/dashboard/admin/members">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manage Members
                </CardTitle>
                <CardDescription>View, edit, and manage member profiles</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/announcements">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Announcements
                </CardTitle>
                <CardDescription>Create and manage community announcements</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/contributions">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Contributions
                </CardTitle>
                <CardDescription>Track and manage member contributions</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/funeral-support">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Funeral Support
                </CardTitle>
                <CardDescription>Manage funeral support cases</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/analytics">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>View community statistics and insights</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/settings">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>Configure site settings and preferences</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Members */}
        <Card className="border-2 bg-card">
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Latest member registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMembers && recentMembers.length > 0 ? (
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.surname}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.region}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
