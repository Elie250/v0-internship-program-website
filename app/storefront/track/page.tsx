import type { Metadata } from 'next'
import { StorefrontComingSoon } from '@/components/storefront/storefront-coming-soon'

export const metadata: Metadata = {
  title: 'Track Order | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default function StorefrontTrackPage() {
  return (
    <StorefrontComingSoon titleKey="storefront.track.title" bodyKey="storefront.track.soon" />
  )
}
