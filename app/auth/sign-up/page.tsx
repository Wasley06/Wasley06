"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Info } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    title: "",
    gender: "",
    firstName: "",
    surname: "",
    yearOfBirth: "",
    region: "",
    county: "",
    postcode: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    refereeName: "",
    refereeMobile: "",
    localAdminName: "",
    localAdminMobile: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!consentGiven) {
      setError("Please consent to the privacy statement")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            title: formData.title,
            gender: formData.gender,
            first_name: formData.firstName,
            surname: formData.surname,
            year_of_birth: formData.yearOfBirth,
            region: formData.region,
            county: formData.county,
            postcode: formData.postcode,
            mobile: formData.mobile,
            referee_name: formData.refereeName,
            referee_mobile: formData.refereeMobile,
            local_admin_name: formData.localAdminName,
            local_admin_mobile: formData.localAdminMobile,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10 bg-muted/30">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <div className="animate-jiggle">
                <Image
                  src="/tanzania-flag-waving.png"
                  alt="Tanzania Flag"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div className="w-20 h-20">
                <Image
                  src="/logo.png"
                  alt="Jumuiya Ya Waisilamu UK Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="animate-jiggle" style={{ animationDelay: "0.2s" }}>
                <Image src="/uk-flag.png" alt="UK Flag" width={60} height={60} className="object-contain" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-center font-[family-name:var(--font-logo)] text-primary">
              Jumuiya Ya Waisilamu UK
            </h2>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Membership Registration</CardTitle>
              <CardDescription>Join our community and access member benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* About You Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">About You</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.title} onValueChange={(value) => handleChange("title", value)} required>
                        <SelectTrigger id="title">
                          <SelectValue placeholder="Please Select Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Mr</SelectItem>
                          <SelectItem value="mrs">Mrs</SelectItem>
                          <SelectItem value="miss">Miss</SelectItem>
                          <SelectItem value="ms">Ms</SelectItem>
                          <SelectItem value="dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">
                        Gender <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)} required>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Please Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surname">
                        Surname <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="surname"
                        type="text"
                        required
                        value={formData.surname}
                        onChange={(e) => handleChange("surname", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearOfBirth">
                        Year of Birth <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.yearOfBirth}
                        onValueChange={(value) => handleChange("yearOfBirth", value)}
                        required
                      >
                        <SelectTrigger id="yearOfBirth">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">
                        Region <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.region} onValueChange={(value) => handleChange("region", value)} required>
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="london">London</SelectItem>
                          <SelectItem value="south-east">South East</SelectItem>
                          <SelectItem value="south-west">South West</SelectItem>
                          <SelectItem value="midlands">Midlands</SelectItem>
                          <SelectItem value="north">North</SelectItem>
                          <SelectItem value="scotland">Scotland</SelectItem>
                          <SelectItem value="wales">Wales</SelectItem>
                          <SelectItem value="northern-ireland">Northern Ireland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Your Referees / Witness Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Your Referees / Witness</h3>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="refereeName">
                        Referee Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="refereeName"
                        type="text"
                        required
                        value={formData.refereeName}
                        onChange={(e) => handleChange("refereeName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refereeMobile">
                        Referee Mobile Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="refereeMobile"
                        type="tel"
                        required
                        value={formData.refereeMobile}
                        onChange={(e) => handleChange("refereeMobile", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="localAdminName">
                        Local Admin Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="localAdminName"
                        type="text"
                        required
                        value={formData.localAdminName}
                        onChange={(e) => handleChange("localAdminName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="localAdminMobile">
                        Local Admin Mobile Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="localAdminMobile"
                        type="tel"
                        required
                        value={formData.localAdminMobile}
                        onChange={(e) => handleChange("localAdminMobile", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Address & Account Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Address & Account</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="county">
                        County <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="county"
                        type="text"
                        required
                        value={formData.county}
                        onChange={(e) => handleChange("county", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">
                        Outward Postcode <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="postcode"
                        type="text"
                        required
                        value={formData.postcode}
                        onChange={(e) => handleChange("postcode", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">
                        Mobile Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => handleChange("mobile", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consent & Submission */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent"
                      checked={consentGiven}
                      onCheckedChange={(checked) => setConsentGiven(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer text-foreground">
                      I consent to the terms outlined in the{" "}
                      <Link href="/privacy" className="text-primary underline hover:text-primary/80">
                        Privacy Statement
                      </Link>
                      . I understand how my personal information will be handled.
                    </Label>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full h-14 bg-[rgb(25,135,84)] hover:bg-[rgb(20,110,68)] dark:bg-[rgb(40,167,69)] dark:hover:bg-[rgb(30,140,55)] text-white font-semibold text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Submit"}
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-sm text-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                  <div className="text-sm">
                    <Link href="/" className="text-muted-foreground hover:text-foreground">
                      ← Back to home
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
