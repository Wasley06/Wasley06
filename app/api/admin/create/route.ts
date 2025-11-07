import { type NextRequest, NextResponse } from "next/server"
import { createAdminUser, getAdminSession } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username, password, fullName, email } = await request.json()

    if (!username || !password || !fullName || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const success = await createAdminUser(username, password, fullName, email)

    if (!success) {
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Create admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
