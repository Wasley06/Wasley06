import { createClient } from "@/lib/supabase/server"

export async function getUserWithRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null, role: null }
  }

  // Get user profile with role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return {
    user,
    profile,
    role: profile?.role || "member",
  }
}
