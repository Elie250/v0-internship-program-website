import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'
import { COMPANY } from '@/lib/company/constants'

function missionSnippet(text: string, maxLength = 300): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.length <= maxLength) return trimmed
  const cut = trimmed.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

export async function MissionSnippetSection() {
  const profile = await loadPublicCompanyProfile()
  const text = missionSnippet(profile.mission)
  if (!text) return null

  return (
    <section className="home-section home-section--compact bg-[var(--brand-navy)] text-on-dark py-10">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-sky)]">
          Our mission
        </p>
        <p className="text-base sm:text-lg text-white/90 leading-relaxed">{text}</p>
        <Link href="/about" className="inline-block no-underline hover:no-underline">
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 text-white hover:bg-white/10 bg-transparent"
          >
            About {COMPANY.brandName}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
