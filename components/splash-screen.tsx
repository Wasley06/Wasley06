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
    }, 5500)

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
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#16a085] via-[#2980b9] to-[#f39c12]" />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23000000' strokeWidth='1' opacity='0.15'%3E%3Cpath d='M100 0 L100 200 M0 100 L200 100'/%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Cpath d='M100 20 L180 100 L100 180 L20 100 Z'/%3E%3Ccircle cx='100' cy='100' r='40'/%3E%3Cpath d='M60 60 L140 60 L140 140 L60 140 Z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          backgroundRepeat: "repeat",
        }}
      />

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
