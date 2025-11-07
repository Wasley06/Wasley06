import { redirect } from "next/navigation"
import { getUserWithRole } from "@/lib/auth-helpers"

export default async function DashboardPage() {
  const { user, profile, role } = await getUserWithRole()

  if (!user) {
    redirect("/auth/login")
  }

  // Redirect based on role
  if (role === "dev") {
    redirect("/dashboard/dev")
  } else if (role === "admin") {
    redirect("/dashboard/admin")
  } else {
    redirect("/dashboard/member")
  }
}
