"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Code,
  Zap,
  Activity,
  Database,
  Shield,
  Gauge,
  FileText,
  BarChart3,
  Eye,
  Flame,
  HardDrive,
  Flag,
  Terminal,
  Clock,
  RotateCcw,
  Users,
  UserCog,
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings,
  Edit,
} from "lucide-react"
import Link from "next/link"

type Profile = {
  id: string
  first_name: string | null
  surname: string | null
  role: string
  created_at: string
}

type DevDashboardLayoutProps = {
  profile: Profile | null
  admins: Profile[]
}

export function DevDashboardLayout({ profile, admins }: DevDashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "content", label: "Content Manager", icon: Edit },
    { id: "speed", label: "Speed Insights", icon: Gauge },
    { id: "deployments", label: "Deployments", icon: Zap },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "observability", label: "Observability", icon: Activity },
    { id: "firewall", label: "Firewall", icon: Shield },
    { id: "ai", label: "AI", icon: Flame },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "flags", label: "Flags", icon: Flag },
    { id: "build-logs", label: "Build Logs", icon: Terminal },
    { id: "runtime", label: "Runtime", icon: Clock },
    { id: "rollback", label: "Instant Rollback", icon: RotateCcw },
    { id: "database", label: "Database", icon: Database },
    { id: "admins", label: "Admin Management", icon: UserCog },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Code className="h-6 w-6 text-sidebar-primary" />
              <span className="font-semibold text-sidebar-foreground">Dev Console</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-sidebar-foreground">
                <p className="font-medium">{profile?.first_name || "Developer"}</p>
                <p className="text-xs text-muted-foreground">Dev Access</p>
              </div>
              <ThemeToggle />
            </div>
            <form action="/auth/signout" method="post">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent border-[rgb(220,53,69)] text-[rgb(220,53,69)] hover:bg-[rgb(220,53,69)] hover:text-white hover:scale-105 hover:shadow-md transition-all duration-200"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Greetings {profile?.first_name || "Developer"} (Dev)</h1>
              <p className="text-sm text-muted-foreground">JUMUIYA YA WAISLAM UK - Developer Console</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Site Overview</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Status</CardTitle>
                      <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">Operational</div>
                      <p className="text-xs text-muted-foreground">All systems running</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">99.9%</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">124ms</div>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Deployments</CardTitle>
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common development tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent hover:bg-primary/10"
                    onClick={() => setActiveSection("content")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Site Content
                  </Button>
                  <Link href="/dashboard/admin/members">
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-primary/10">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/announcements">
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-primary/10">
                      <Bell className="h-4 w-4 mr-2" />
                      Announcements
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "content" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Content Manager</h2>
                <p className="text-sm text-muted-foreground">Edit all site content and settings</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                    <CardDescription>Main landing page content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Main Heading</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supporting our community with dignity and compassion
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subtitle</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        A Tanzanian Muslim community in the United Kingdom...
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Hero Content
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>About Us Section</CardTitle>
                    <CardDescription>Community information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Section Heading</label>
                      <p className="text-sm text-muted-foreground mt-1">About Us</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        We are a group of Tanzanians living in the United Kingdom...
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit About Content
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Phone and email details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Phone Number</label>
                      <p className="text-sm text-muted-foreground mt-1">+44 7846 821186</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Addresses</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        info@jumuiyawaislamuk.com
                        <br />
                        support@jumuiyawaislamuk.com
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contact Info
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Footer Content</CardTitle>
                    <CardDescription>Footer text and links</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Organization Name</label>
                      <p className="text-sm text-muted-foreground mt-1">Jumuiya ya Waislamu UK</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tagline</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supporting our community with dignity and compassion
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Footer Content
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Navigation Menu</CardTitle>
                    <CardDescription>Header navigation items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Menu Items</label>
                      <p className="text-sm text-muted-foreground mt-1">About, Contact, Sign In, Register</p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Navigation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Member Benefits</CardTitle>
                    <CardDescription>Services offered to members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Benefits List</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Funeral Support, Repatriation Services, Financial Assistance, Community Guidance
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Benefits
                    </Button>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Site Settings</CardTitle>
                    <CardDescription>Global site configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">Site Name</label>
                        <p className="text-sm text-muted-foreground mt-1">JUMUIYA YA WAISLAM UK</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Primary Color</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded bg-[rgb(25,135,84)]" />
                          <p className="text-sm text-muted-foreground">Green</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Theme Mode</label>
                        <p className="text-sm text-muted-foreground mt-1">Light/Dark Toggle Enabled</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-4 bg-primary hover:bg-primary/90">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Site Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Database Content</CardTitle>
                  <CardDescription>Manage dynamic content stored in database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/dashboard/admin/announcements" className="block">
                      <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-primary/10">
                        <Bell className="h-4 w-4 mr-2" />
                        Announcements
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/members" className="block">
                      <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-primary/10">
                        <Users className="h-4 w-4 mr-2" />
                        Member Profiles
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent hover:bg-primary/10"
                      onClick={() => setActiveSection("database")}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Database Tables
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "admins" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Admin Management</h2>
                  <p className="text-sm text-muted-foreground">Manage admin and dev access</p>
                </div>
                <Link href="/dashboard/dev/add-admin">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Users className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </Link>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Current Admins</CardTitle>
                  <CardDescription>{admins.length} admin(s) with elevated access</CardDescription>
                </CardHeader>
                <CardContent>
                  {admins.length > 0 ? (
                    <div className="space-y-4">
                      {admins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {admin.first_name} {admin.surname}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {admin.role === "dev" ? "Developer" : "Administrator"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                admin.role === "dev" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              {admin.role.toUpperCase()}
                            </span>
                            {admin.role !== "dev" && (
                              <Button variant="outline" size="sm">
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No admins found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection !== "overview" && activeSection !== "admins" && activeSection !== "content" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold capitalize">{activeSection.replace("-", " ")}</h2>
                <p className="text-sm text-muted-foreground">
                  {activeSection === "speed" && "Monitor and optimize site performance"}
                  {activeSection === "deployments" && "View deployment history and manage releases"}
                  {activeSection === "logs" && "Application logs and error tracking"}
                  {activeSection === "analytics" && "Usage analytics and insights"}
                  {activeSection === "observability" && "System monitoring and health checks"}
                  {activeSection === "firewall" && "Security settings and firewall rules"}
                  {activeSection === "ai" && "AI integrations and configurations"}
                  {activeSection === "storage" && "Storage usage and file management"}
                  {activeSection === "flags" && "Feature flags and toggles"}
                  {activeSection === "build-logs" && "Build output and compilation logs"}
                  {activeSection === "runtime" && "Runtime statistics and performance"}
                  {activeSection === "rollback" && "Rollback to previous deployments"}
                  {activeSection === "database" && "Database management and queries"}
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>This section is under development</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Advanced {activeSection.replace("-", " ")} features will be available here.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
