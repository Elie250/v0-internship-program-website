import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import { DigestSubscribeForm } from '@/components/engineering/digest-subscribe-form'
import { loadPublishedArticles } from '@/lib/engineering/queries'
import { ENGINEERING_ARTICLE_TAGS } from '@/lib/engineering/articles'
import { COMPANY } from '@/lib/company/constants'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ tag?: string }>
}

export default async function EngineeringBlogPage({ searchParams }: PageProps) {
  const { tag } = await searchParams
  const articles = await loadPublishedArticles({ tag: tag || undefined, limit: 48 })
  const featured = articles.filter((a) => a.is_featured).slice(0, 2)
  const regular = articles.filter((a) => !featured.some((f) => f.id === a.id))

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Field Notes
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Practical engineering for the field
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Wiring, PLC, embedded, and solar tips from {COMPANY.brandName} practitioners. Build
            smarter, fix faster, and grow your engineering career.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/engineering/authors"
              className="text-sm px-3 py-1 rounded-full border border-slate-300 text-slate-700"
            >
              Authors
            </Link>
            <Link
              href="/subscriber"
              className="text-sm px-3 py-1 rounded-full border border-slate-300 text-slate-700"
            >
              Subscriber hub
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/engineering"
              className={`text-sm px-3 py-1 rounded-full border ${
                !tag ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]' : 'border-slate-300 text-slate-700'
              }`}
            >
              All topics
            </Link>
            {ENGINEERING_ARTICLE_TAGS.map((item) => (
              <Link
                key={item}
                href={`/engineering?tag=${item}`}
                className={`text-sm px-3 py-1 rounded-full border capitalize ${
                  tag === item
                    ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                    : 'border-slate-300 text-slate-700'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-8">
            {articles.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-slate-700 font-medium">No field notes published yet.</p>
                <p className="text-sm text-slate-500 mt-2">
                  Check back soon — our engineers and lecturers are preparing the first articles.
                </p>
              </div>
            ) : (
              <>
                {featured.length > 0 ? (
                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900">Featured</h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {featured.map((article) => (
                        <FieldNotesArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                ) : null}
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {tag ? `${tag} articles` : 'Latest articles'}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {regular.map((article) => (
                      <FieldNotesArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <DigestSubscribeForm />
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">Need hands-on help?</p>
              <p>
                Engineering Support plans include community access, AI assist, and engineer-reviewed
                tickets.
              </p>
              <Link href="/engineering-support" className="text-[var(--brand-navy)] font-medium underline">
                Explore support plans
              </Link>
            </div>
            <Link
              href="/engineering/rss.xml"
              className="block text-sm text-slate-500 hover:text-[var(--brand-navy)]"
            >
              RSS feed
            </Link>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
