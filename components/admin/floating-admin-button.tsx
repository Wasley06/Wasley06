"use client"

import { Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function FloatingAdminButton() {
  return (
    <Link href="/admin" className="fixed top-24 right-4 z-40 group">
      <Button
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 gap-2 group-hover:scale-110"
      >
        <Shield className="h-5 w-5" />
        <span className="hidden sm:inline font-semibold">Admin</span>
      </Button>
    </Link>
  )
}
