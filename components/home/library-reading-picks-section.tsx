import Link from 'next/link'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { loadFeaturedLibraryPicks } from '@/lib/library/queries'

export async function LibraryReadingPicksSection() {
  const picks = await loadFeaturedLibraryPicks(4)
  if (picks.length === 0) return null

  return (
    <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)] mb-2">
              Energy Library
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Reading picks</h2>
            <p className="text-slate-600">
              Gallery highlights, books, and culture chosen for your next read — open any title and
              explore without an account.
            </p>
          </div>
          <Link
            href="/library"
            className="text-sm font-semibold text-[var(--brand-navy)] underline underline-offset-2"
          >
            Browse the full library
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((item) => (
            <LibraryItemCard key={item.id} item={item} showViews />
          ))}
        </div>
      </div>
    </section>
  )
}
