import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadHomePersonalization } from '@/lib/home/personalization'

export async function HomeSignedInStrip() {
  const personalization = await loadHomePersonalization()
  if (!personalization) return null

  const { displayName, portal, activeCourses, isStudent } = personalization

  return (
    <section
      aria-label="Continue learning"
      className="border-b border-[color-mix(in_srgb,var(--brand-navy)_12%,white)] bg-[var(--brand-pale)] px-4 py-5"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="section-eyebrow mb-1">Continue learning</p>
          <p className="text-base font-semibold text-[var(--brand-navy)]">
            Welcome back, {displayName}
          </p>
          <p className="text-sm text-[var(--brand-navy-soft)] mt-0.5">
            {isStudent && activeCourses.length > 0
              ? 'Pick up an active programme or open your learning portal.'
              : `Jump straight into your ${portal.label.toLowerCase()}.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          {isStudent && activeCourses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeCourses.map((course) => (
                <Link
                  key={course.id}
                  href={course.href}
                  className="home-tile-link inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-[var(--brand-navy)]/40"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[var(--brand-navy)]" />
                  <span className="truncate max-w-[12rem]">{course.title}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <Link href={portal.href} className="home-tile-link shrink-0">
            <Button size="sm" className="w-full sm:w-auto bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              <GraduationCap className="mr-2 h-4 w-4" />
              {portal.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
