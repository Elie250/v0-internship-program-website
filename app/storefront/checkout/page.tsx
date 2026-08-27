import type { Metadata } from 'next'
import { StorefrontComingSoon } from '@/components/storefront/storefront-coming-soon'

export const metadata: Metadata = {
  title: 'Checkout | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontCheckoutPage() {
  return (
    <StorefrontComingSoon
      titleKey="storefront.checkout.title"
      bodyKey="storefront.checkout.soon"
    />
  )
}
