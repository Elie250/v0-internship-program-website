import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { LibrarySearch } from '@/components/library/library-search'
import {
  loadFeaturedCultureItems,
  loadFeaturedEngineeringProjects,
  loadFeaturedLibraryPicks,
  loadPopularLibraryItems,
  loadPublishedLibraryItems,
  searchPublishedLibraryItems,
} from '@/lib/library/queries'
import {
  LIBRARY_CULTURE_TYPES,
  LIBRARY_GALLERY_TYPES,
  LIBRARY_PILLARS,
  type LibraryCultureType,
  type LibraryGalleryType,
  type LibraryPillar,
} from '@/lib/library/items'
import {
  buildLibraryHref,
  LIBRARY_LANGUAGES,
  LIBRARY_SORT_OPTIONS,
  type LibrarySort,
} from '@/lib/library/urls'
import { getLibraryMessages, parseSiteLocale } from '@/lib/i18n/library'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Energy Library',
  description:
    'Explore the Energy Library — company gallery, books, and culture. Browse by category and start reading without an account.',
}

type PageProps = {
  searchParams: Promise<{
    category?: string
    type?: string
    gallery?: string
    lang?: string
    sort?: string
    q?: string
  }>
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

function parseGalleryType(value?: string): LibraryGalleryType | undefined {
  if (value === 'photo' || value === 'engineering_project') return value
  return undefined
}

function parseSort(value?: string): LibrarySort {
  return value === 'popular' ? 'popular' : 'newest'
}

function parseLanguage(value?: string): string | undefined {
  if (value === 'rw' || value === 'en') return value
  return undefined
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const { category: categoryParam, type: typeParam, gallery: galleryParam, lang: langParam, sort: sortParam, q: qParam } =
    await searchParams
  const category = parseCategory(categoryParam)
  const cultureType = parseCultureType(typeParam)
  const galleryType = parseGalleryType(galleryParam)
  const language = parseLanguage(langParam)
  const sort = parseSort(sortParam)
  const query = qParam?.trim() ?? ''
  const locale = parseSiteLocale(language)
  const t = getLibraryMessages(locale)

  const browseOptions = {
    pillar: category,
    cultureType: category === 'culture' ? cultureType : undefined,
    galleryType: category === 'gallery' ? galleryType : undefined,
    language,
    sort,
  }

  const showHomeSections = !category && !query && sort === 'newest' && !language

  const [items, featuredCulture, featuredProjects, readingPicks, popularMonth] = await Promise.all([
    query
      ? searchPublishedLibraryItems(query, browseOptions)
      : loadPublishedLibraryItems(browseOptions),
    showHomeSections ? loadFeaturedCultureItems(3) : Promise.resolve([]),
    showHomeSections ? loadFeaturedEngineeringProjects(6) : Promise.resolve([]),
    showHomeSections ? loadFeaturedLibraryPicks(3) : Promise.resolve([]),
    showHomeSections ? loadPopularLibraryItems({ limit: 5 }) : Promise.resolve([]),
  ])

  const baseParams = { category, type: cultureType, gallery: galleryType, lang: language, sort, q: query || undefined }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        <section className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
              {t.title}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-slate-600 max-w-2xl">{t.subtitle}</p>
          </div>
          <Suspense fallback={<div className="h-10 rounded-md bg-slate-100 animate-pulse" />}>
            <LibrarySearch />
          </Suspense>
        </section>

        {query ? (
          <p className="text-sm text-slate-600">
            {items.length} result{items.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
          </p>
        ) : null}

        {showHomeSections && featuredProjects.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{t.projectsTitle}</h2>
                <p className="text-sm text-slate-600">{t.projectsSubtitle}</p>
              </div>
              <Link
                href={buildLibraryHref({ category: 'gallery', gallery: 'engineering_project' })}
                className="text-sm font-medium text-[var(--brand-navy)] underline"
              >
                {t.viewAllProjects}
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((item) => (
                <LibraryItemCard key={item.id} item={item} showViews />
              ))}
            </div>
          </section>
        ) : null}

        {showHomeSections && readingPicks.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Reading picks</h2>
                <p className="text-sm text-slate-600">Curated highlights from our library team.</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {readingPicks.map((item) => (
                <LibraryItemCard key={item.id} item={item} showViews />
              ))}
            </div>
          </section>
        ) : null}

        {showHomeSections && featuredCulture.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Fresh from our community</h2>
                <p className="text-sm text-slate-600">Recent Inkuru, ibisigo, imivugo, and creative arts.</p>
              </div>
              <Link
                href={buildLibraryHref({ category: 'culture' })}
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

        {showHomeSections && popularMonth.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Popular this month</h2>
              <p className="text-sm text-slate-600">Most opened titles from the last 30 days.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularMonth.map((item) => (
                <LibraryItemCard key={item.id} item={item} showViews />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildLibraryHref({ ...baseParams, category: undefined, type: undefined })}
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
                href={buildLibraryHref({
                  ...baseParams,
                  category: pillar.id,
                  type: pillar.id === 'culture' ? cultureType : undefined,
                })}
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

          {category === 'gallery' ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildLibraryHref({ ...baseParams, category: 'gallery', gallery: undefined })}
                className={`text-sm px-3 py-1 rounded-full border ${
                  !galleryType
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-slate-300 text-slate-700'
                }`}
              >
                All gallery
              </Link>
              {LIBRARY_GALLERY_TYPES.map((type) => (
                <Link
                  key={type.id}
                  href={buildLibraryHref({ ...baseParams, category: 'gallery', gallery: type.id })}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    galleryType === type.id
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {type.id === 'engineering_project' ? t.engineeringProject : t.photosEvents}
                </Link>
              ))}
            </div>
          ) : null}

          {category === 'culture' ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildLibraryHref({ ...baseParams, category: 'culture', type: undefined })}
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
                  href={buildLibraryHref({ ...baseParams, category: 'culture', type: type.id })}
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-slate-500 self-center">Language</span>
              <Link
                href={buildLibraryHref({ ...baseParams, lang: undefined })}
                className={`text-sm px-3 py-1 rounded-full border ${
                  !language ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-300 text-slate-700'
                }`}
              >
                All
              </Link>
              {LIBRARY_LANGUAGES.map((lang) => (
                <Link
                  key={lang.id}
                  href={buildLibraryHref({ ...baseParams, lang: lang.id })}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    language === lang.id
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {lang.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-slate-500 self-center">Sort</span>
              {LIBRARY_SORT_OPTIONS.map((option) => (
                <Link
                  key={option.id}
                  href={buildLibraryHref({ ...baseParams, sort: option.id })}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    sort === option.id
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          {category ? (
            <p className="text-sm text-slate-600">
              {LIBRARY_PILLARS.find((pillar) => pillar.id === category)?.description}
            </p>
          ) : null}
        </section>

        {items.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <LibraryItemCard key={item.id} item={item} showViews={sort === 'popular'} />
            ))}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-800">
              {query ? 'No matches for your search' : 'Nothing published here yet'}
            </p>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              {query
                ? 'Try a different keyword or clear filters.'
                : category === 'culture'
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
