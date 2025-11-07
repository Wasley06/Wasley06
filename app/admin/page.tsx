import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const admin = await getAdminSession()

  if (!admin) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  const [{ data: members }, { data: contributions }, { data: announcements }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("contributions")
      .select(`
      *,
      profiles:user_id (
        first_name,
        surname,
        mobile
      )
    `)
      .order("created_at", { ascending: false }),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }),
  ])

  return (
    <AdminDashboard
      members={members || []}
      contributions={contributions || []}
      announcements={announcements || []}
      admin={admin}
    />
  )
}
