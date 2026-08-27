import type { Metadata } from 'next'
import { StorefrontOrderCard } from '@/components/storefront/storefront-order-card'
import {
  StorefrontTrackForm,
  StorefrontTrackHeader,
  StorefrontTrackNotFound,
} from '@/components/storefront/storefront-track-form'
import { getPublicOrder } from '@/lib/shop/public-order'
import { STOREFRONT_GUTTER, STOREFRONT_NARROW } from '@/lib/shop/storefront-layout'

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
    <section className={`${STOREFRONT_GUTTER} py-10 sm:py-14`}>
      <div className={STOREFRONT_NARROW}>
      <StorefrontTrackHeader />
      <StorefrontTrackForm defaultOrder={queried} />
      {queried && result ? (
        <div className="mt-10">
          <StorefrontOrderCard order={result} showTitle={false} />
        </div>
      ) : null}
      {queried && !result ? <StorefrontTrackNotFound /> : null}
      </div>
    </section>
  )
}
