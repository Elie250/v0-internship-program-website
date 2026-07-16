'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackSitePageview } from '@/lib/analytics/client-site-traffic'

/** Records pageviews into Admin (daily rollups). Disclosed in Privacy Policy — no popup. */
export function AnalyticsBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    trackSitePageview(pathname || '/')
  }, [pathname])

  return null
}
