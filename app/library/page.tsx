import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { loadFeaturedCultureItems, loadPublishedLibraryItems } from '@/lib/library/queries'
import {
  LIBRARY_CULTURE_TYPES,
  LIBRARY_PILLARS,
  type LibraryCultureType,
  type LibraryPillar,
} from '@/lib/library/items'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Energy Library',
  description:
    'Explore the Energy Library — company gallery, books, and culture. Browse by category and start reading without an account.',
}

type PageProps = {
  searchParams: Promise<{ category?: string; type?: string }>
}

function parseCategory(value?: string): LibraryPillar | undefined {
  if (value === 'gallery' || value === 'books' || value === 'culture') return value
  return undefined
}

function parseCultureType(value?: string): LibraryCultureType | undefined {
  if (value === 'inkuru' || value === 'ibisigo' || value === 'imivugo' || value === 'creative' || value === 'other') {
    return value
  }
  return undefined
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const { category: categoryParam, type: typeParam } = await searchParams
  const category = parseCategory(categoryParam)
  const cultureType = parseCultureType(typeParam)

  const [items, featuredCulture] = await Promise.all([
    loadPublishedLibraryItems({
      pillar: category,
      cultureType: category === 'culture' ? cultureType : undefined,
    }),
    !category ? loadFeaturedCultureItems(3) : Promise.resolve([]),
  ])

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Energy Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Energy Library</h1>
          <p className="text-slate-600 max-w-2xl">
            Browse our company gallery, books, and culture. Pick a category, open a title, and start
            reading or exploring — no login required.
          </p>
        </section>

        {!category && featuredCulture.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Fresh from our community</h2>
                <p className="text-sm text-slate-600">Recent Inkuru, ibisigo, imivugo, and creative arts.</p>
              </div>
              <Link
                href="/library?category=culture"
                className="text-sm font-medium text-[var(--brand-navy)] underline"
              >
                View all culture
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCulture.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Share your writing</p>
            <p className="text-sm text-slate-600 mt-1">
              Students can submit Inkuru, ibisigo, imivugo, and creative pieces for the library.
            </p>
          </div>
          <Link
            href="/student/library"
            className="inline-flex items-center justify-center rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white no-underline hover:no-underline hover:bg-[var(--brand-navy)]/90"
          >
            Submit your writing
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/library"
              className={`text-sm px-3 py-1.5 rounded-full border ${
                !category
                  ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
            >
              All
            </Link>
            {LIBRARY_PILLARS.map((pillar) => (
              <Link
                key={pillar.id}
                href={`/library?category=${pillar.id}`}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  category === pillar.id
                    ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                {pillar.label}
              </Link>
            ))}
          </div>

          {category === 'culture' ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/library?category=culture"
                className={`text-sm px-3 py-1 rounded-full border ${
                  !cultureType
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-slate-300 text-slate-700'
                }`}
              >
                All culture
              </Link>
              {LIBRARY_CULTURE_TYPES.map((type) => (
                <Link
                  key={type.id}
                  href={`/library?category=culture&type=${type.id}`}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    cultureType === type.id
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {type.label}
                </Link>
              ))}
            </div>
          ) : null}

          {category ? (
            <p className="text-sm text-slate-600">
              {LIBRARY_PILLARS.find((pillar) => pillar.id === category)?.description}
            </p>
          ) : null}
        </section>

        {items.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <LibraryItemCard key={item.id} item={item} />
            ))}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-800">Nothing published here yet</p>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              {category === 'culture'
                ? 'Be the first to share Inkuru, ibisigo, or imivugo — students can submit from their portal.'
                : category
                  ? `Check back soon for new ${LIBRARY_PILLARS.find((p) => p.id === category)?.label.toLowerCase()} items.`
                  : 'Our team is preparing gallery, books, and culture content for you.'}
            </p>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
