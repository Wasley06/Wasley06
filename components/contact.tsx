import { Card } from "@/components/ui/card"
import { Mail, Phone } from "lucide-react"

export function Contact() {
  return (
    <section id="contact" className="py-16 sm:py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground">
            Get in Touch
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We're here to help. Reach out to us anytime for support, information, or to join our community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          <Card className="p-8 bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Phone</h3>
                <p className="text-base text-muted-foreground">Call us anytime for immediate assistance</p>
              </div>
            </div>
            <a
              href="tel:+447846821186"
              className="inline-block px-6 py-3 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-foreground font-medium"
            >
              +44 7846 821186
            </a>
          </Card>

          <Card className="p-8 bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Email</h3>
                <p className="text-base text-muted-foreground">Send us a message and we'll respond promptly</p>
              </div>
            </div>
            <div className="space-y-3">
              <a
                href="mailto:info@jumuiyawaislamuk.com"
                className="block px-6 py-3 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-foreground font-medium text-center truncate"
              >
                info@jumuiyawaislamuk.com
              </a>
              <a
                href="mailto:support@jumuiyawaislamuk.com"
                className="block px-6 py-3 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-foreground font-medium text-center truncate"
              >
                support@jumuiyawaislamuk.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
