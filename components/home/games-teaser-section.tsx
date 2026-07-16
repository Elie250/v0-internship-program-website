import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import { fetchBrainGamesForHub } from '@/lib/brain-training/hub-catalog'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import {
  SectionShuffleSlots,
  type ShuffleCardItem,
} from '@/components/home/section-shuffle-slots'

/**
 * Homepage Arcade teaser: uses uploaded thumbnails when present,
 * otherwise each game’s Arcade cover art (never a blank slot).
 */
export async function GamesTeaserSection() {
  let thumbBySlug = new Map<string, string | null>()
  try {
    const rows = await fetchBrainGamesForHub()
    thumbBySlug = new Map(rows.map((r) => [r.slug, r.thumbnailUrl]))
  } catch {
    thumbBySlug = new Map()
  }

  const items: ShuffleCardItem[] = BRAIN_GAME_CATALOG.map((game) => {
    const imageUrl = thumbBySlug.get(game.slug) || null

    return {
      id: game.slug,
      title: game.name,
      subtitle: game.shortTagline,
      href: `/tools/brain-training/${game.slug}`,
      imageUrl,
      artFrom: game.art.from,
      artTo: game.art.to,
      art: game.art,
      badge: game.categoryLabel,
      ctaLabel: `~${game.estimatedMinutes} min · Play`,
    }
  })

  if (items.length === 0) return null

  return (
    <section id="games" className="home-section home-section--compact home-section--white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Games"
            title="Brain Training Arcade"
            description="Short cognitive and engineering drills to sharpen focus before class or lab sessions."
            align="left"
            className="mb-0"
          />
          <Link href="/tools/brain-training">
            <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Open Arcade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <SectionShuffleSlots items={items} slots={3} />
      </div>
    </section>
  )
}
