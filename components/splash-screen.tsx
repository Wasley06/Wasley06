"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash")

    if (hasSeenSplash) {
      setIsVisible(false)
      return
    }

    const fadeTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 3000) // Reduced from 5000 to 3000

    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem("hasSeenSplash", "true")
    }, 3500) // Reduced from 6000 to 3500

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-[url('/islamic-pattern-gold.jpg')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#16a34a] via-[#0ea5e9] to-[#eab308]" />

      <div className="relative flex flex-col items-center gap-8 px-4">
        <div className="flex items-center justify-center gap-8 md:gap-12">
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

          <div className="animate-logo-pop">
            <Image
              src="/logo.png"
              alt="Jumuiya ya Waislamu UK"
              width={200}
              height={200}
              className="h-32 w-32 object-contain drop-shadow-2xl md:h-48 md:w-48"
              priority
            />
          </div>

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

        <div className="animate-fade-in-up text-center">
          <h1 className="text-balance text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
            Jumuiya ya Waislamu UK
          </h1>
          <p className="mt-3 text-base text-white/95 md:text-lg">Tanzanian Muslim Community in the UK</p>
        </div>

        <div className="animate-pulse">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-full animate-loading-bar bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
