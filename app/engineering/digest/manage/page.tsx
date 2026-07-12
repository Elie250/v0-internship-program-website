import { Suspense } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { DigestPreferencesPanel } from '@/components/engineering/digest-preferences-panel'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ token?: string; unsubscribed?: string }>
}

export default async function DigestManagePage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = params.token ?? null
  const unsubscribed = params.unsubscribed === '1'

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
        <nav className="text-sm text-slate-600">
          <Link href="/engineering" className="text-[var(--brand-navy)] underline font-medium">
            Field Notes
          </Link>
          <span aria-hidden> · </span>
          <span>Digest preferences</span>
        </nav>
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">The Weekly Circuit</h1>
          <p className="text-slate-600">
            Choose which topics you receive and how often. Leave topics empty to get every new
            article.
          </p>
        </header>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
            <DigestPreferencesPanel token={token} unsubscribed={unsubscribed} />
          </Suspense>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
