import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getUserWithRole } from "@/lib/auth-helpers"
import { Bell } from "lucide-react"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { getTimeBasedGreeting, formatUserName } from "@/lib/greeting-utils"

export default async function MemberDashboardPage() {
  const { user, profile, role } = await getUserWithRole()

  if (!user) {
    redirect("/auth/login")
  }

  if (role !== "member") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("published", true)
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
            <h1 className="text-2xl sm:text-3xl font-normal text-foreground">
              {greeting}, <span className="font-bold text-[rgb(25,135,84)] dark:text-[rgb(40,167,69)]">{userName}</span>
            </h1>
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

        <Card className="border-2 mb-8 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Community Announcements</CardTitle>
            </div>
            <CardDescription>Stay updated with the latest community news</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-primary pl-4 py-2">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements at this time.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="text-primary">Welcome!</CardTitle>
              <CardDescription>You're part of the Jumuiya ya Waislamu UK community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Email: {user.email}</p>
              <p className="text-sm text-muted-foreground">Status: {profile?.membership_status}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-card">
            <CardHeader>
              <CardTitle className="text-secondary">Community Support</CardTitle>
              <CardDescription>Access resources and connect with members</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-secondary hover:bg-secondary/90">View Resources</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-card">
            <CardHeader>
              <CardTitle className="text-accent-foreground">Get Help</CardTitle>
              <CardDescription>Contact us for support and assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/#contact">
                <Button variant="outline" className="w-full border-accent/50 hover:bg-accent/10 bg-transparent">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
