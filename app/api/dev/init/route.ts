import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const DEV_EMAIL = "wasley@dev.com"
const DEV_PASSWORD = "Kingsley@06"

export async function POST() {
  try {
    const adminClient = createAdminClient()

    const { data: existingUser } = await adminClient.auth.admin.listUsers()
    const devUserExists = existingUser?.users.some((user) => user.email === DEV_EMAIL)

    if (devUserExists) {
      console.log("[v0] Dev user already exists")
      return NextResponse.json({ success: true, message: "Dev user already exists" })
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: "Developer",
      },
    })

    if (createError) {
      console.error("[v0] Failed to create dev user:", createError)
      return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
    }

    if (newUser.user) {
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: newUser.user.id,
        role: "dev",
        first_name: "Developer",
        surname: "Admin",
        membership_status: "active",
      })

      if (profileError) {
        console.error("[v0] Failed to create dev profile:", profileError)
        // Continue anyway, the profile might already exist
      }
    }

    console.log("[v0] Dev user created successfully")
    return NextResponse.json({ success: true, message: "Dev user created successfully" })
  } catch (error) {
    console.error("[v0] Error initializing dev user:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
