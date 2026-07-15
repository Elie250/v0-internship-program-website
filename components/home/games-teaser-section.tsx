import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBrainGamesForHub } from '@/app/actions/brain-training'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import {
  SectionShuffleSlots,
  type ShuffleCardItem,
} from '@/components/home/section-shuffle-slots'

export async function GamesTeaserSection() {
  const gameRows = await getBrainGamesForHub().catch(() => [])
  const thumbBySlug = new Map(gameRows.map((r) => [r.slug, r.thumbnailUrl]))
  const active = new Set(
    gameRows.length === 0
      ? BRAIN_GAME_CATALOG.map((g) => g.slug)
      : gameRows.filter((r) => r.isActive !== false).map((r) => r.slug)
  )

  const items: ShuffleCardItem[] = BRAIN_GAME_CATALOG.filter((g) => active.has(g.slug)).map(
    (game) => ({
      id: game.slug,
      title: game.name,
      subtitle: game.shortTagline,
      href: `/tools/brain-training/${game.slug}`,
      imageUrl: thumbBySlug.get(game.slug) || null,
      artFrom: game.art.from,
      artTo: game.art.to,
      badge: game.categoryLabel,
      ctaLabel: `~${game.estimatedMinutes} min · Play`,
    })
  )

  if (items.length === 0) return null

  return (
    <section id="games" className="home-section home-section--compact home-section--white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Games"
            title="Brain Training Arcade"
            description="Three live previews cycle through cognitive and engineering drills — warm up before labs."
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
