import { Card } from "@/components/ui/card"
import { Users, Heart, Home } from "lucide-react"

export function About() {
  return (
    <section id="about" className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground">
            About Us
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We are a group of Tanzanians living in the United Kingdom. We have come together to lend a helping hand to
            each other during troubled times, especially when a member is deceased.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <Card className="p-8 bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Community</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              A united group of Tanzanian Muslims supporting each other through life's challenges with compassion and
              solidarity.
            </p>
          </Card>

          <Card className="p-8 bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-6">
              <Heart className="h-7 w-7 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Support</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              Collective contributions ensure every member receives dignified support during their most difficult times.
            </p>
          </Card>

          <Card className="p-8 bg-card border border-border hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-6">
              <Home className="h-7 w-7 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Dignity</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              Ensuring members are buried or transported back home with the utmost respect and dignity they deserve.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
