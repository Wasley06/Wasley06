"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Save, XIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getTimeBasedGreeting, formatUserName } from "@/lib/greeting-utils"

interface AnnouncementsPageProps {
  profile: any
  role: string
  announcements: any[]
}

export function AnnouncementsPage({ profile, role, announcements: initialAnnouncements }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("normal")
  const [published, setPublished] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const greeting = getTimeBasedGreeting()
  const userName = formatUserName(profile?.title, profile?.first_name, profile?.surname)

  const handleCreate = async () => {
    if (!title || !content) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("announcements")
        .insert([
          {
            title,
            content,
            priority,
            published,
            author_id: profile.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setAnnouncements([data, ...announcements])
      setIsCreating(false)
      setTitle("")
      setContent("")
      setPriority("normal")
      setPublished(true)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error creating announcement:", error)
      alert("Failed to create announcement. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setContent(announcement.content)
    setPriority(announcement.priority)
    setPublished(announcement.published)
  }

  const handleUpdate = async (id: string) => {
    if (!title || !content) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          title,
          content,
          priority,
          published,
        })
        .eq("id", id)

      if (error) throw error

      setAnnouncements(
        announcements.map((a) =>
          a.id === id
            ? {
                ...a,
                title,
                content,
                priority,
                published,
              }
            : a,
        ),
      )
      setEditingId(null)
      setTitle("")
      setContent("")
      setPriority("normal")
      setPublished(true)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating announcement:", error)
      alert("Failed to update announcement. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id)

      if (error) throw error

      setAnnouncements(announcements.filter((a) => a.id !== id))
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting announcement:", error)
      alert("Failed to delete announcement. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("announcements").update({ published: !currentStatus }).eq("id", id)

      if (error) throw error

      setAnnouncements(announcements.map((a) => (a.id === id ? { ...a, published: !currentStatus } : a)))
      router.refresh()
    } catch (error) {
      console.error("[v0] Error toggling announcement status:", error)
      alert("Failed to update announcement status. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "normal":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

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

        <div className="mb-6">
          <Link
            href={role === "dev" ? "/dashboard/dev" : "/dashboard/admin"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Announcements</h2>
            <p className="text-sm text-muted-foreground">Create and manage community announcements</p>
          </div>
          <Button
            onClick={() => {
              setIsCreating(!isCreating)
              if (isCreating) {
                setTitle("")
                setContent("")
                setPriority("normal")
                setPublished(true)
              }
            }}
            className="gap-2 bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"
          >
            {isCreating ? (
              <>
                <XIcon className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Announcement
              </>
            )}
          </Button>
        </div>

        {isCreating && (
          <Card className="border-2 border-primary/20 mb-6 bg-card">
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>Share important updates with the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Announcement title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  placeholder="Announcement content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={published ? "published" : "draft"}
                    onValueChange={(val) => setPublished(val === "published")}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"
                disabled={isLoading || !title || !content}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Creating..." : "Create Announcement"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No announcements yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="border-l-4 border-l-primary bg-card">
                {editingId === announcement.id ? (
                  <>
                    <CardHeader>
                      <CardTitle>Edit Announcement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          placeholder="Announcement title..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Content</label>
                        <Textarea
                          placeholder="Announcement content..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={4}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Priority</label>
                          <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <Select
                            value={published ? "published" : "draft"}
                            onValueChange={(val) => setPublished(val === "published")}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdate(announcement.id)}
                          className="flex-1 bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"
                          disabled={isLoading || !title || !content}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null)
                            setTitle("")
                            setContent("")
                            setPriority("normal")
                            setPublished(true)
                          }}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(announcement.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {announcement.priority.toUpperCase()}
                          </Badge>
                          {announcement.published ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{announcement.content}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                          disabled={isLoading}
                          className="hover:scale-105 hover:shadow-md transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublished(announcement.id, announcement.published)}
                          disabled={isLoading}
                          className="hover:scale-105 hover:shadow-md transition-all duration-200"
                        >
                          {announcement.published ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={isLoading}
                          className="hover:scale-105 hover:shadow-md transition-all duration-200 border-[rgb(220,53,69)] text-[rgb(220,53,69)] hover:bg-[rgb(220,53,69)] hover:text-white"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
