"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User, Shield } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export function MembersNavigation({ user, isAdmin }: { user: SupabaseUser; isAdmin?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-background/60 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/members" className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex gap-2 items-center">
              <div className="w-8 h-8 relative animate-wave" style={{ animationDelay: "0s" }}>
                <Image src="/tanzania-flag-waving.png" alt="Tanzania Flag" fill className="object-contain" />
              </div>
              <div className="w-10 h-10 relative">
                <Image src="/logo.png" alt="Jumuiya Ya Waisilamu UK Logo" fill className="object-contain" />
              </div>
              <div className="w-8 h-8 relative animate-wave" style={{ animationDelay: "0.1s" }}>
                <Image src="/uk-flag.png" alt="UK Flag" fill className="object-contain" />
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground font-[family-name:var(--font-logo)]">
              Jumuiya Ya Waisilamu UK
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/members"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-foreground">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4 border-b border-border">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Link
                href="/members"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-base font-medium text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <div className="py-2">
                <ThemeToggle />
              </div>
              <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
