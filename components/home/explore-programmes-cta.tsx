import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExploreProgrammesCta() {
  return (
    <section
      id="explore-programmes"
      aria-label="Explore all programmes"
      className="bg-[var(--brand-navy)] text-on-dark px-4 py-8 sm:py-10"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Explore all programmes
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 max-w-xl">
            Browse the full catalogue of training, internship, and career programmes.
          </p>
        </div>
        <Link href="/learning" className="shrink-0 w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-white text-[var(--brand-navy)] hover:bg-white/90 font-semibold"
          >
            View all programmes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
