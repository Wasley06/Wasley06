"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Check if splash has been shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash")

    if (hasSeenSplash) {
      setIsVisible(false)
      return
    }

    // Start fade out after 5 seconds
    const fadeTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 5000)

    // Remove splash screen after fade completes
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem("hasSeenSplash", "true")
    }, 6000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent transition-opacity duration-1000 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-[url('/islamic-pattern-gold.jpg')] opacity-10" />

      <div className="relative flex flex-col items-center gap-8 px-4">
        {/* Flags Container */}
        <div className="flex items-center justify-center gap-8 md:gap-12">
          {/* Tanzania Flag */}
          <div className="animate-jiggle-delayed">
            <Image
              src="/tanzania-flag-waving.png"
              alt="Tanzania Flag"
              width={120}
              height={120}
              className="h-20 w-20 object-contain drop-shadow-2xl md:h-32 md:w-32"
              priority
            />
          </div>

          {/* Logo - Pops up with scale animation */}
          <div className="animate-logo-pop">
            <Image
              src="/logo.png"
              alt="JUMUIYA YA WAISLAM UK"
              width={200}
              height={200}
              className="h-32 w-32 object-contain drop-shadow-2xl md:h-48 md:w-48"
              priority
            />
          </div>

          {/* UK Flag */}
          <div className="animate-jiggle">
            <Image
              src="/uk-flag.png"
              alt="UK Flag"
              width={120}
              height={120}
              className="h-20 w-20 object-contain drop-shadow-2xl md:h-32 md:w-32"
              priority
            />
          </div>
        </div>

        {/* Organization Name */}
        <div className="animate-fade-in-up text-center">
          <h1 className="text-balance text-2xl font-bold text-white drop-shadow-lg md:text-4xl">
            JUMUIYA YA WAISLAM UK
          </h1>
          <p className="mt-2 text-sm text-white/90 md:text-base">Tanzanian Muslim Community in the UK</p>
        </div>

        {/* Loading indicator */}
        <div className="animate-pulse">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-full animate-loading-bar bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
