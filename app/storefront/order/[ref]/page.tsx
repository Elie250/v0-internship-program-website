import type { Metadata } from 'next'
import { StorefrontComingSoon } from '@/components/storefront/storefront-coming-soon'

export const metadata: Metadata = {
  title: 'Order | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontOrderPage() {
  return (
    <StorefrontComingSoon titleKey="storefront.order.title" bodyKey="storefront.order.soon" />
  )
}
