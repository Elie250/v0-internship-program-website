import type { Metadata } from 'next'
import { StorefrontOrderCard } from '@/components/storefront/storefront-order-card'
import {
  StorefrontTrackForm,
  StorefrontTrackHeader,
  StorefrontTrackNotFound,
} from '@/components/storefront/storefront-track-form'
import { getPublicOrder } from '@/lib/shop/public-order'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Track Order | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ order?: string }>
}

export default async function StorefrontTrackPage({ searchParams }: PageProps) {
  const { order: raw } = await searchParams
  const queried = String(raw ?? '').trim()
  const result = queried ? await getPublicOrder(queried) : null

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <StorefrontTrackHeader />
      <StorefrontTrackForm defaultOrder={queried} />
      {queried && result ? (
        <div className="mt-10">
          <StorefrontOrderCard order={result} showTitle={false} />
        </div>
      ) : null}
      {queried && !result ? <StorefrontTrackNotFound /> : null}
    </section>
  )
}
