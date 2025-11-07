import type React from "react"
import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SplashScreen } from "@/components/splash-screen"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
})

export const metadata: Metadata = {
  title: "JUMUIYA YA WAISLAM UK - Tanzanian Muslim Community",
  description: "Supporting Tanzanian Muslims in the United Kingdom with dignity and compassion during difficult times.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${cinzel.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SplashScreen />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
