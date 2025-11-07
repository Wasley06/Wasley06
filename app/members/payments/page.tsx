import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PaymentHistory from "@/components/members/payment-history"

export default async function PaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's contributions
  const { data: contributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <PaymentHistory contributions={contributions || []} />
}
