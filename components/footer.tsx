import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[rgb(220,230,240)] dark:bg-[rgb(30,35,40)] border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Jumuiya ya Waislamu UK</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Supporting our community with dignity and compassion
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Link href="/#about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <span>•</span>
              <Link href="/#contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <span>•</span>
              <a href="tel:+447846821186" className="hover:text-foreground transition-colors">
                +44 7846 821186
              </a>
              <span>•</span>
              <a href="mailto:info@jumuiyawaislamuk.com" className="hover:text-foreground transition-colors">
                info@jumuiyawaislamuk.com
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Jumuiya ya Waislamu UK. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
