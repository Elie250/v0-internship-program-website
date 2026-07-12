import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { loadPublishedSeries } from '@/lib/engineering/queries'

export const dynamic = 'force-dynamic'

export default async function EngineeringSeriesIndexPage() {
  const series = await loadPublishedSeries()

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        <div>
          <Link href="/engineering" className="text-sm text-[var(--brand-navy)] underline font-medium">
            ← Field Notes
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Article series</h1>
          <p className="text-slate-600 mt-2">Multi-part guides and learning paths.</p>
        </div>
        {series.length === 0 ? (
          <p className="text-slate-600">No series published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {series.map((item) => (
              <Link
                key={item.id}
                href={`/engineering/series/${item.slug}`}
                className="block rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md no-underline"
              >
                {item.cover_image_url ? (
                  <div className="relative h-36 bg-slate-100">
                    <Image src={item.cover_image_url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <div className="p-5">
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  {item.description ? (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-500 mt-2">{item.articleCount ?? 0} articles</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
