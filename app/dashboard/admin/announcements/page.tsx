import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserWithRole } from "@/lib/auth-helpers"
import { AnnouncementsPage } from "@/components/admin/announcements-page"

export default async function AdminAnnouncementsPage() {
  const { user, profile, role } = await getUserWithRole()

  if (!user) {
    redirect("/auth/login")
  }

  if (role !== "admin" && role !== "dev") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  return <AnnouncementsPage profile={profile} role={role} announcements={announcements || []} />
}
