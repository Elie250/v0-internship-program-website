import Link from 'next/link'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { loadPublishedArticles } from '@/lib/engineering/queries'
import { loadFeaturedLibraryPicks } from '@/lib/library/queries'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ReadExploreSection() {
  const [libraryPicks, articles] = await Promise.all([
    loadFeaturedLibraryPicks(3),
    loadPublishedArticles({ limit: 3 }),
  ])

  if (libraryPicks.length === 0 && articles.length === 0) return null

  return (
    <section id="read-explore" className="home-section home-section--white">
      <div className="max-w-6xl mx-auto space-y-10">
        <HomeSectionHeader
          eyebrow="Read & explore"
          title="Library & Field Notes"
          description="Build a reading habit with our public Energy Library and engineering blog — no login required to browse."
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {libraryPicks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Energy Library</h3>
                  <p className="text-sm text-slate-600">Gallery, books & culture</p>
                </div>
                <Link
                  href="/library"
                  className="text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2 shrink-0"
                >
                  Browse library
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {libraryPicks.map((item) => (
                  <LibraryItemCard key={item.id} item={item} showViews />
                ))}
              </div>
            </div>
          ) : null}

          {articles.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Field Notes</h3>
                  <p className="text-sm text-slate-600">Latest from the blog</p>
                </div>
                <Link
                  href="/engineering"
                  className="text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2 shrink-0"
                >
                  View all articles
                </Link>
              </div>
              <div className="grid gap-4">
                {articles.map((article) => (
                  <FieldNotesArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
