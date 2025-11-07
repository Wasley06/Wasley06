import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export interface AdminUser {
  id: string
  username: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser | null> {
  const supabase = await createClient()

  // Fetch admin user
  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single()

  if (error || !admin) {
    console.log("[v0] Admin login failed: user not found")
    return null
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.password_hash)
  if (!isValid) {
    console.log("[v0] Admin login failed: invalid password")
    return null
  }

  // Create session
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await supabase.from("admin_sessions").insert({
    admin_id: admin.id,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  // Update last login
  await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", admin.id)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  })

  // Log activity
  await supabase.from("admin_activity_logs").insert({
    admin_id: admin.id,
    action: "login",
    details: { username },
  })

  return {
    id: admin.id,
    username: admin.username,
    full_name: admin.full_name,
    email: admin.email,
    role: admin.role,
    is_active: admin.is_active,
  }
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("admin_session")?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from("admin_sessions")
    .select("*, admin_users(*)")
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (sessionError || !session) {
    return null
  }

  const admin = session.admin_users as any

  return {
    id: admin.id,
    username: admin.username,
    full_name: admin.full_name,
    email: admin.email,
    role: admin.role,
    is_active: admin.is_active,
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("admin_session")?.value

  if (sessionToken) {
    const supabase = await createClient()
    await supabase.from("admin_sessions").delete().eq("session_token", sessionToken)
  }

  cookieStore.delete("admin_session")
}

export async function createAdminUser(
  username: string,
  password: string,
  fullName: string,
  email: string,
  role = "admin",
): Promise<boolean> {
  const supabase = await createClient()
  const passwordHash = await hashPassword(password)

  const { error } = await supabase.from("admin_users").insert({
    username,
    password_hash: passwordHash,
    full_name: fullName,
    email,
    role,
  })

  return !error
}
