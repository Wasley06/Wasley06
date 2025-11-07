import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Create or update profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      title: body.title,
      gender: body.gender,
      first_name: body.firstName,
      surname: body.surname,
      year_of_birth: Number.parseInt(body.yearOfBirth),
      region: body.region,
      county: body.county,
      postcode: body.postcode,
      mobile: body.mobile,
      role: "member",
      membership_status: "pending",
    })

    if (profileError) throw profileError

    // Create referee record
    if (body.refereeName) {
      const { error: refereeError } = await supabase.from("referees").insert({
        user_id: user.id,
        referee_name: body.refereeName,
        referee_mobile: body.refereeMobile,
        local_admin_name: body.localAdminName,
        local_admin_mobile: body.localAdminMobile,
      })

      if (refereeError) throw refereeError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error creating profile:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
