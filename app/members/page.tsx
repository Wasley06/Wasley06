import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MembersNavigation } from "@/components/members-navigation"
import { Services } from "@/components/services"
import { Benefits } from "@/components/benefits"
import { Footer } from "@/components/footer"
import { FloatingAdminButton } from "@/components/admin/floating-admin-button"

export default async function MembersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <main className="min-h-screen">
      <MembersNavigation user={user} isAdmin={isAdmin} />
      {isAdmin && <FloatingAdminButton />}
      <div className="pt-16 sm:pt-20">
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 sm:mb-6 text-balance">
                Welcome, {user.email?.split("@")[0]}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                Access your member benefits and services below. We're here to support you and your family.
              </p>
            </div>
          </div>
        </section>
        <Services />
        <Benefits />
      </div>
      <Footer />
    </main>
  )
}
