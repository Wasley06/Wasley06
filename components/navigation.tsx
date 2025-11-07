"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogIn, UserPlus, Code } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background border-b border-border" : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 relative animate-wave" style={{ animationDelay: "0s" }}>
                <Image src="/tanzania-flag-waving.png" alt="Tanzania Flag" fill className="object-contain" />
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                <Image src="/logo.png" alt="Jumuiya Ya Waisilamu UK Logo" fill className="object-contain" />
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 relative animate-wave" style={{ animationDelay: "0.1s" }}>
                <Image src="/uk-flag.png" alt="UK Flag" fill className="object-contain" />
              </div>
            </div>
            <h1 className="text-sm sm:text-base lg:text-xl font-semibold tracking-tight text-foreground truncate font-[family-name:var(--font-logo)]">
              JUMUIYA YA WAISLAM UK
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Contact
            </button>
            <ThemeToggle />
            <Link href="/auth/dev-login">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-primary/10 hover:scale-105 transition-all duration-200"
              >
                <Code className="h-4 w-4" />
                <span className="hidden lg:inline">Dev</span>
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-primary/10 hover:scale-105 transition-all duration-200"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden lg:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="sm"
                className="rounded-full gap-2 bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden lg:inline">Register</span>
              </Button>
            </Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-foreground">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 sm:py-6 border-t border-border">
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={() => scrollToSection("about")}
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors text-left py-2"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors text-left py-2"
              >
                Contact
              </button>
              <div className="py-2">
                <ThemeToggle />
              </div>
              <Link href="/auth/dev-login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent justify-center hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-200"
                >
                  <Code className="h-4 w-4" />
                  Dev Access
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent justify-center hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up" className="w-full">
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 justify-center hover:scale-105 hover:shadow-lg transition-all duration-200">
                  <UserPlus className="h-4 w-4" />
                  Register
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
