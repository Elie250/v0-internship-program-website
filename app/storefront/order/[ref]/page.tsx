import type { Metadata } from 'next'
import {
  StorefrontOrderCard,
  StorefrontOrderMissing,
} from '@/components/storefront/storefront-order-card'
import { getPublicOrder } from '@/lib/shop/public-order'
import { normalizeOrderCode } from '@/lib/shop/order-lookup'
import { STOREFRONT_GUTTER, STOREFRONT_NARROW } from '@/lib/shop/storefront-layout'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ placed?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params
  const order = await getPublicOrder(ref)
  if (!order) {
    return {
      title: 'Order | Energy & Logics Shop',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `${order.orderNumber} | Energy & Logics Shop`,
    robots: { index: false, follow: false },
  }
}

export default async function StorefrontOrderPage({ params, searchParams }: PageProps) {
  const { ref } = await params
  const { placed } = await searchParams
  const order = await getPublicOrder(ref)

  if (!order) {
    return <StorefrontOrderMissing attempted={normalizeOrderCode(ref)} />
  }

  return (
    <section className={`${STOREFRONT_GUTTER} py-10 sm:py-14`}>
      <div className={STOREFRONT_NARROW}>
        <StorefrontOrderCard order={order} placed={placed === '1'} />
      </div>
    </section>
  )
}
