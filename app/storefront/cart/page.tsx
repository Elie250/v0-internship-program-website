import type { Metadata } from 'next'
import { StorefrontCartPage } from '@/components/storefront/storefront-cart-page'

export const metadata: Metadata = {
  title: 'Cart | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontCartRoute() {
  return <StorefrontCartPage />
}
