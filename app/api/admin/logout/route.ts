import { NextResponse } from "next/server"
import { logoutAdmin } from "@/lib/admin-auth"

export async function POST() {
  try {
    await logoutAdmin()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
