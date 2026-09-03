import type { Metadata } from 'next'
import { StorefrontCheckout } from '@/components/storefront/storefront-checkout'

export const metadata: Metadata = {
  title: 'Checkout | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontCheckoutPage() {
  return <StorefrontCheckout />
}
