import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserWithRole } from "@/lib/auth-helpers"
import { DevDashboardLayout } from "@/components/dev-dashboard-layout"

export default async function DevDashboardPage() {
  const { user, profile, role } = await getUserWithRole()

  if (!user) {
    redirect("/auth/login")
  }

  if (role !== "dev") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Fetch all admins
  const { data: admins } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "dev"])
    .order("created_at", { ascending: false })

  return <DevDashboardLayout profile={profile} admins={admins || []} />
}
