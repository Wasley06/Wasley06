import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
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
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90">Go to Sign In</Button>
              </Link>
              <div className="mt-4 text-center text-sm">
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  ← Back to home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
