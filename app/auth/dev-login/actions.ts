"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const DEV_USERNAME = "Wasley@DEV"
const DEV_PASSWORD = "Kingsley@06"
const DEV_EMAIL = "wasleyinc@gmail.com"

export async function devLogin(username: string, password: string) {
  if (username !== DEV_USERNAME || password !== DEV_PASSWORD) {
    return { error: "Invalid dev credentials. Please check your username and password." }
  }

  try {
    console.log("[v0] Attempting dev login with email:", DEV_EMAIL)

    const supabase = await createClient()

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    })

    if (signInError) {
      console.error("[v0] Dev login error:", signInError.message)
      return { error: `Login failed: ${signInError.message}` }
    }

    if (!authData.user) {
      return { error: "Authentication failed. No user data returned." }
    }

    console.log("[v0] Authentication successful, updating role to dev...")

    const { error: updateError } = await supabase.from("profiles").update({ role: "dev" }).eq("id", authData.user.id)

    if (updateError) {
      console.error("[v0] Error updating role:", updateError.message)
      // Don't fail the login if role update fails, just log it
    } else {
      console.log("[v0] Role updated to dev successfully")
    }

    console.log("[v0] Dev login successful, redirecting to dashboard...")
  } catch (error) {
    console.error("[v0] Dev login error:", error)
    return { error: "An error occurred during login. Please try again." }
  }

  redirect("/dashboard/dev")
}
