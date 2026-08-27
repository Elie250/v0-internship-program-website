import type { Metadata } from 'next'
import { StorefrontComingSoon } from '@/components/storefront/storefront-coming-soon'

export const metadata: Metadata = {
  title: 'Product | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontProductDetailPage() {
  return (
    <StorefrontComingSoon titleKey="storefront.product.title" bodyKey="storefront.product.soon" />
  )
}
