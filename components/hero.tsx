"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/community-flags.png"
          alt="Community"
          fill
          className="object-cover object-center opacity-[0.03] dark:opacity-[0.005]"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/98 via-background/95 to-background/90 dark:from-background/95 dark:via-background/90 dark:to-background/85" />
      </div>

      <Link
        href="/"
        className="absolute top-24 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 opacity-30 dark:opacity-20 animate-float z-10 hover:opacity-50 transition-opacity cursor-pointer"
      >
        <Image src="/logo.png" alt="JUMUIYA YA WAISLAM UK Logo" fill className="object-contain" />
      </Link>

      <Link
        href="/"
        className="absolute top-24 right-4 sm:right-10 w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 opacity-20 dark:opacity-15 animate-float hover:opacity-40 transition-opacity cursor-pointer"
      >
        <Image src="/tanzania-flag-waving.png" alt="Tanzania Flag" fill className="object-contain" />
      </Link>
      <Link
        href="/"
        className="absolute bottom-24 left-4 sm:left-10 w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 opacity-20 dark:opacity-15 animate-float-delayed hover:opacity-40 transition-opacity cursor-pointer"
      >
        <Image src="/uk-flag.png" alt="UK Flag" fill className="object-contain" />
      </Link>

      <div className="absolute inset-0 bg-[url('/islamic-pattern-gold.jpg')] opacity-[0.03] dark:opacity-[0.01]" />

      <div
        className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-balance leading-[1.1] text-foreground">
            Supporting our community with{" "}
            <span className="text-[rgb(25,135,84)] dark:text-[rgb(40,167,69)]">dignity</span> and{" "}
            <span className="text-[rgb(13,110,253)]">compassion</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed px-4">
            A Tanzanian Muslim community in the United Kingdom, united in providing support during life's most difficult
            moments.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
            <Link href="/auth/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full text-base px-6 sm:px-8 h-12 bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white hover:scale-105 hover:shadow-xl shadow-lg transition-all duration-200"
              >
                Become a Member
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full text-base px-6 sm:px-8 h-12 bg-transparent border-2 border-foreground/20 hover:bg-[rgb(25,135,84)]/10 hover:border-[rgb(25,135,84)] dark:hover:bg-[rgb(40,167,69)]/10 dark:hover:border-[rgb(40,167,69)] hover:scale-105 transition-all duration-200"
              >
                Member Sign In
              </Button>
            </Link>
          </div>

          <div className="pt-6 sm:pt-8 px-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Members get access to:</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgb(25,135,84)]/10 dark:bg-[rgb(40,167,69)]/10 text-[rgb(25,135,84)] dark:text-[rgb(40,167,69)] font-medium">
                Funeral Support
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgb(13,110,253)]/10 text-[rgb(13,110,253)] font-medium">
                Repatriation Services
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgb(255,193,7)]/10 text-[rgb(184,134,11)] dark:text-[rgb(255,193,7)] font-medium">
                Financial Assistance
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgb(25,135,84)]/10 dark:bg-[rgb(40,167,69)]/10 text-[rgb(25,135,84)] dark:text-[rgb(40,167,69)] font-medium">
                Community Guidance
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  )
}
