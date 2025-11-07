import { Card } from "@/components/ui/card"
import { Users, Heart, Shield, Phone } from "lucide-react"

const benefits = [
  {
    icon: Users,
    title: "Community Network",
    description: "Connect with fellow Tanzanian Muslims across the UK and build lasting relationships.",
  },
  {
    icon: Heart,
    title: "Emotional Support",
    description: "Access to counseling and spiritual guidance during difficult times.",
  },
  {
    icon: Shield,
    title: "Financial Protection",
    description: "Collective contributions ensure no family faces financial burden alone.",
  },
  {
    icon: Phone,
    title: "24/7 Assistance",
    description: "Round-the-clock support line for urgent matters and emergencies.",
  },
]

export function Benefits() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 sm:mb-6 text-balance">
            Member Benefits
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-balance px-4">
            As a valued member, you have access to comprehensive support and resources.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <Card key={index} className="p-6 sm:p-8 border-border/50 bg-card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{benefit.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
