import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const services = [
  {
    title: "Funeral Support",
    description:
      "Comprehensive assistance with funeral arrangements, ensuring Islamic traditions are honored with dignity and respect.",
  },
  {
    title: "Repatriation Services",
    description:
      "Coordinating the transportation of deceased members back to Tanzania, handling all necessary documentation and logistics.",
  },
  {
    title: "Financial Assistance",
    description:
      "Collective contributions from members to ensure no family faces financial burden during their time of grief.",
  },
  {
    title: "Community Guidance",
    description:
      "Providing emotional and spiritual support to families, connecting them with resources and community members.",
  },
]

export function Services() {
  return (
    <section id="services" className="py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-balance">
            Our Services
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
            Comprehensive support services designed to help our community members during their most challenging times.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <Card key={index} className="p-8 border-border/50 bg-card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
