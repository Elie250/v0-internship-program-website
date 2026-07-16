'use client'

import { classifyTrafficSource } from '@/lib/brain-training/engagement'

const VISITOR_KEY = 'eh_site_visitor'
const SOURCE_KEY = 'eh_site_traffic_source'
const LAST_PATH_KEY = 'eh_site_last_path'

function getVisitorKey(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing && existing.length >= 8) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(VISITOR_KEY, next)
    return next
  } catch {
    return `anon_${Date.now()}`
  }
}

function resolveTrafficSource() {
  try {
    const cached = sessionStorage.getItem(SOURCE_KEY)
    if (cached) return cached
    const source = classifyTrafficSource({
      referrer: document.referrer,
      search: window.location.search,
      host: window.location.hostname,
    })
    sessionStorage.setItem(SOURCE_KEY, source)
    return source
  } catch {
    return 'direct'
  }
}

/** One pageview per path per browser session. */
export function trackSitePageview(pathname?: string) {
  if (typeof window === 'undefined') return

  const path = pathname || window.location.pathname
  try {
    const last = sessionStorage.getItem(LAST_PATH_KEY)
    if (last === path) return
    sessionStorage.setItem(LAST_PATH_KEY, path)
  } catch {
    /* continue */
  }

  void fetch('/api/public/site-traffic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      trafficSource: resolveTrafficSource(),
      visitorKey: getVisitorKey(),
    }),
    keepalive: true,
  }).catch(() => {})
}
