'use client'

import type { BrainPlayEvent } from '@/lib/brain-training/engagement'
import { classifyTrafficSource } from '@/lib/brain-training/engagement'

const VISITOR_KEY = 'eh_brain_visitor'
const SOURCE_KEY = 'eh_brain_traffic_source'
const DEDUPE_PREFIX = 'eh_brain_play_'

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
    return classifyTrafficSource({
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      search: typeof window !== 'undefined' ? window.location.search : '',
      host: typeof window !== 'undefined' ? window.location.hostname : '',
    })
  }
}

function shouldSend(event: BrainPlayEvent, gameSlug: string): boolean {
  if (event === 'complete') return true
  try {
    const key = `${DEDUPE_PREFIX}${event}_${gameSlug}`
    const prev = sessionStorage.getItem(key)
    const now = Date.now()
    if (prev && now - Number(prev) < 20 * 60 * 1000) return false
    sessionStorage.setItem(key, String(now))
    return true
  } catch {
    return true
  }
}

/** Fire-and-forget engagement ping. Disclosed in Privacy Policy — no popup. */
export function trackBrainEngagement(
  event: BrainPlayEvent,
  gameSlug: string = 'hub',
  opts?: { isGuest?: boolean }
) {
  if (typeof window === 'undefined') return
  if (!shouldSend(event, gameSlug)) return

  const trafficSource = resolveTrafficSource()
  const visitorKey = getVisitorKey()
  const isGuest = opts?.isGuest !== false

  void fetch('/api/public/brain-game-plays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      gameSlug,
      trafficSource,
      visitorKey,
      isGuest,
      path: window.location.pathname,
    }),
    keepalive: true,
  }).catch(() => {})
}
