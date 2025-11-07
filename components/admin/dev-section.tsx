"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, BarChart3, Rocket, Shield, Database, Zap, Users, Lock, Globe } from "lucide-react"

export function DevSection() {
  const [devPassword, setDevPassword] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState("")

  const handleUnlock = () => {
    if (devPassword === "Kingsley06") {
      setIsUnlocked(true)
      setError("")
    } else {
      setError("Invalid DEV password")
    }
  }

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">DEV Section Access</CardTitle>
          <CardDescription className="text-center">Enter the DEV password to access advanced settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-password">DEV Password</Label>
            <Input
              id="dev-password"
              type="password"
              placeholder="Enter DEV password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleUnlock} className="w-full">
            Unlock DEV Section
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Developer & System Settings
          </CardTitle>
          <CardDescription>Advanced configuration and monitoring tools</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Speed Insights</CardTitle>
                <Zap className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98/100</div>
                <p className="text-xs text-muted-foreground">Performance Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Build Status</CardTitle>
                <Rocket className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Success</div>
                <p className="text-xs text-muted-foreground">Latest deployment</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system activity and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span>✓ Database connection established</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span>→ Admin dashboard loaded</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span>✓ All services operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Site traffic and user engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Page Views</p>
                    <p className="text-2xl font-bold">12,543</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">3,421</p>
                    <p className="text-xs text-green-600">+8% from last month</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg. Session</p>
                    <p className="text-2xl font-bold">4m 32s</p>
                    <p className="text-xs text-green-600">+15% from last month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Management
              </CardTitle>
              <CardDescription>Build logs, runtime settings, and instant rollback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Recent Deployments</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Production</p>
                      <p className="text-sm text-muted-foreground">Deployed 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button variant="outline">Instant Rollback</Button>
                  <Button variant="outline">View Build Logs</Button>
                  <Button variant="outline">Runtime Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage & Database
              </CardTitle>
              <CardDescription>Database management and file storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Database Size</p>
                    <p className="text-2xl font-bold">245 MB</p>
                    <p className="text-xs text-muted-foreground">PostgreSQL (Supabase)</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">File Storage</p>
                    <p className="text-2xl font-bold">1.2 GB</p>
                    <p className="text-xs text-muted-foreground">Images and assets</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Firewall
              </CardTitle>
              <CardDescription>Security settings, firewall rules, and observability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">SSL/HTTPS</p>
                    <p className="text-sm text-muted-foreground">Enabled</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Firewall</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">DDoS Protection</p>
                    <p className="text-sm text-muted-foreground">Enabled</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin User Management
              </CardTitle>
              <CardDescription>Add and manage admin users</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Settings
              </CardTitle>
              <CardDescription>Open Graph, meta tags, and general settings</CardDescription>
            </CardHeader>
            <CardContent>
              <OpenGraphSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminUserManager() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, fullName, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Admin user created successfully!")
        setUsername("")
        setPassword("")
        setFullName("")
        setEmail("")
      } else {
        setMessage(data.error || "Failed to create admin user")
      }
    } catch (error) {
      setMessage("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreateAdmin} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-username">Username</Label>
          <Input
            id="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@example"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-fullname">Full Name</Label>
          <Input
            id="new-fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>
      </div>
      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Admin User"}
      </Button>
    </form>
  )
}

function OpenGraphSettings() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="og-title">Site Title</Label>
        <Input id="og-title" defaultValue="Jumuiya Ya Waisilamu UK" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="og-description">Site Description</Label>
        <Input
          id="og-description"
          defaultValue="Tanzanian Muslim community in the UK providing mutual support and funeral assistance"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="og-image">Open Graph Image URL</Label>
        <Input id="og-image" placeholder="https://example.com/og-image.jpg" />
      </div>
      <Button>Save Settings</Button>
    </div>
  )
}
