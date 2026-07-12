import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FieldNotesArticleBody } from '@/components/engineering/field-notes-article'
import { ArticleSubscriberExtras } from '@/components/engineering/article-subscriber-extras'
import { ArticleViewTracker } from '@/components/engineering/article-view-tracker'
import { DigestSubscribeForm } from '@/components/engineering/digest-subscribe-form'
import {
  loadPublishedArticleBySlug,
  loadPublishedArticles,
  loadSeriesById,
} from '@/lib/engineering/queries'
import { COMPANY } from '@/lib/company/constants'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const article = await loadPublishedArticleBySlug(slug)
  if (!article) return { title: 'Field Notes' }
  return {
    title: `${article.title} | Field Notes`,
    description: article.excerpt || article.body.slice(0, 160),
  }
}

export default async function EngineeringArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await loadPublishedArticleBySlug(slug)
  if (!article) notFound()

  const series = article.series_id ? await loadSeriesById(article.series_id) : null

  const related = (await loadPublishedArticles({ limit: 4 }))
    .filter((item) => item.slug !== slug)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-slate-50">
      <ArticleViewTracker slug={slug} />
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        <nav className="text-sm text-slate-600 flex flex-wrap items-center gap-1">
          <Link href="/engineering" className="text-[var(--brand-navy)] underline font-medium">
            Field Notes
          </Link>
          {series ? (
            <>
              <span aria-hidden>·</span>
              <Link
                href={`/engineering/series/${series.slug}`}
                className="text-[var(--brand-navy)] underline font-medium"
              >
                {series.title}
              </Link>
            </>
          ) : null}
        </nav>
        <FieldNotesArticleBody article={article} />

        <ArticleSubscriberExtras
          slug={slug}
          tags={article.tags}
          authorId={article.author_id}
          authorName={article.author_name}
        />

        {related.length > 0 ? (
          <section className="space-y-3 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">More from {COMPANY.brandName}</h2>
            <ul className="space-y-2">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/engineering/${item.slug}`}
                    className="text-[var(--brand-navy)] font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <DigestSubscribeForm />
      </div>
      <SiteFooter />
    </main>
  )
}
