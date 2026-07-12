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
  { href: '/learning', label: 'Learning', icon: GraduationCap },
  { href: '/internship', label: 'Internship', icon: Briefcase },
  { href: '/career', label: 'Career', icon: Users },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/engineering', label: 'Field Notes', icon: BookOpen },
  { href: '/tools', label: 'Tools', icon: Calculator },
] as const

export function ExploreHubSection() {
  return (
    <section id="explore" className="home-section home-section--compact home-section--white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow={COMPANY.platformName}
          title="Navigate the platform"
          description="Training, career support, public library, field notes, and calculators — choose where to go next."
          className="mb-8"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {EXPLORE_TILES.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="home-tile-link group no-underline hover:no-underline">
              <Card className="h-full border-slate-200 transition-shadow group-hover:shadow-md group-hover:border-[var(--brand-navy)]/25">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[var(--brand-navy)]" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 group-hover:text-[var(--brand-navy)]">
                    {label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
