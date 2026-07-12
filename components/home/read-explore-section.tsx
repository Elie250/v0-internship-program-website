import Link from 'next/link'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { loadPublishedArticles } from '@/lib/engineering/queries'
import { loadFeaturedLibraryPicks } from '@/lib/library/queries'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ReadExploreSection() {
  const [libraryPicks, articles] = await Promise.all([
    loadFeaturedLibraryPicks(2),
    loadPublishedArticles({ limit: 2 }),
  ])

  if (libraryPicks.length === 0 && articles.length === 0) return null

  return (
    <section id="read-explore" className="home-section home-section--compact home-section--white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Read & explore"
            title="Library & Field Notes"
            description="Public reading — no account required."
            align="left"
            className="mb-0"
          />
          <div className="flex gap-4 text-sm font-medium shrink-0">
            <Link href="/library" className="text-[var(--brand-navy)] underline underline-offset-2">
              Library
            </Link>
            <Link href="/engineering" className="text-[var(--brand-navy)] underline underline-offset-2">
              Field Notes
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {libraryPicks.length > 0 ? (
            <div className="grid gap-3">
              {libraryPicks.map((item) => (
                <LibraryItemCard key={item.id} item={item} showViews />
              ))}
            </div>
          ) : null}

          {articles.length > 0 ? (
            <div className="grid gap-3">
              {articles.map((article) => (
                <FieldNotesArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
