import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import { loadPublishedArticles, loadSeriesBySlug } from '@/lib/engineering/queries'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export default async function EngineeringSeriesPage({ params }: PageProps) {
  const { slug } = await params
  const series = await loadSeriesBySlug(slug)
  if (!series) notFound()

  const articles = await loadPublishedArticles({ seriesId: series.id, limit: 48 })

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        <Link href="/engineering/series" className="text-sm text-[var(--brand-navy)] underline font-medium">
          ← All series
        </Link>
        {series.cover_image_url ? (
          <div className="relative h-48 rounded-xl overflow-hidden border border-slate-200">
            <Image src={series.cover_image_url} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{series.title}</h1>
          {series.description ? <p className="text-slate-600">{series.description}</p> : null}
          <p className="text-sm text-slate-500">{articles.length} articles in this series</p>
        </header>
        <div className="grid sm:grid-cols-2 gap-5">
          {articles.map((article, index) => (
            <div key={article.id} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Part {article.series_sort_order ?? index + 1}
              </p>
              <FieldNotesArticleCard article={article} />
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
