import Link from 'next/link'
import {
  BookOpen,
  Briefcase,
  Calculator,
  GraduationCap,
  Library,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { COMPANY } from '@/lib/company/constants'
import { HomeSectionHeader } from '@/components/home/home-section-header'

const EXPLORE_TILES = [
  {
    href: '/learning',
    label: 'Learning',
    description: 'Courses & training programmes',
    icon: GraduationCap,
  },
  {
    href: '/internship',
    label: 'Internship',
    description: 'Hands-on industry placements',
    icon: Briefcase,
  },
  {
    href: '/career',
    label: 'Career',
    description: 'Guidance, workshops & events',
    icon: Users,
  },
  {
    href: '/library',
    label: 'Library',
    description: 'Gallery, books & culture',
    icon: Library,
  },
  {
    href: '/engineering',
    label: 'Blog',
    description: 'Field Notes & engineering tips',
    icon: BookOpen,
  },
  {
    href: '/tools',
    label: 'Tools',
    description: 'Free field calculators',
    icon: Calculator,
  },
] as const

export function ExploreHubSection() {
  return (
    <section id="explore" className="home-section home-section--white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow={`Explore ${COMPANY.platformName}`}
          title="Everything in one place"
          description="Learn, read, build, and grow — pick a path and dive in. No account needed to browse Library, Blog, or Tools."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {EXPLORE_TILES.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="home-tile-link group no-underline hover:no-underline">
              <Card className="h-full border-slate-200 transition-shadow group-hover:shadow-md group-hover:border-[var(--brand-navy)]/25">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 group-hover:text-[var(--brand-navy)]">
                    {label}
                  </p>
                  <p className="text-xs text-slate-600 leading-snug hidden sm:block">{description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
