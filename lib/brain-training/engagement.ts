import type { BrainGameSlug } from '@/lib/brain-training/catalog'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'

export type BrainPlayEvent = 'hub_view' | 'open' | 'complete'

export type TrafficSource =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'google'
  | 'bing'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'direct'
  | 'internal'
  | 'other'

const SOURCES = new Set<TrafficSource>([
  'instagram',
  'facebook',
  'tiktok',
  'google',
  'bing',
  'twitter',
  'linkedin',
  'youtube',
  'direct',
  'internal',
  'other',
])

const SLUGS = new Set(BRAIN_GAME_CATALOG.map((g) => g.slug))

export function isBrainPlayEvent(v: unknown): v is BrainPlayEvent {
  return v === 'hub_view' || v === 'open' || v === 'complete'
}

export function normalizeTrafficSource(v: unknown): TrafficSource {
  if (typeof v === 'string' && SOURCES.has(v as TrafficSource)) return v as TrafficSource
  return 'other'
}

export function normalizeGameSlug(v: unknown): string {
  if (v === 'hub' || v === undefined || v === null || v === '') return 'hub'
  if (typeof v === 'string' && SLUGS.has(v as BrainGameSlug)) return v
  return 'hub'
}

/** Classify document.referrer + UTM for Instagram / Facebook / search etc. */
export function classifyTrafficSource(opts: {
  referrer?: string | null
  search?: string | null
  host?: string | null
}): TrafficSource {
  const params = new URLSearchParams(opts.search || '')
  const utm = (params.get('utm_source') || params.get('utm_medium') || '').toLowerCase()
  const utmCampaign = (params.get('utm_campaign') || '').toLowerCase()
  const blob = `${utm} ${utmCampaign}`

  if (/instagram|ig/.test(blob)) return 'instagram'
  if (/facebook|fb|meta/.test(blob)) return 'facebook'
  if (/tiktok/.test(blob)) return 'tiktok'
  if (/twitter|x\.com|t\.co/.test(blob)) return 'twitter'
  if (/linkedin/.test(blob)) return 'linkedin'
  if (/youtube|yt/.test(blob)) return 'youtube'
  if (/google/.test(blob)) return 'google'
  if (/bing/.test(blob)) return 'bing'

  const ref = (opts.referrer || '').trim()
  if (!ref) return 'direct'

  let hostname = ''
  try {
    hostname = new URL(ref).hostname.toLowerCase()
  } catch {
    return 'other'
  }

  const siteHost = (opts.host || '').toLowerCase().replace(/^www\./, '')
  const refHost = hostname.replace(/^www\./, '')
  if (siteHost && (refHost === siteHost || refHost.endsWith(`.${siteHost}`))) {
    return 'internal'
  }

  if (hostname.includes('instagram.') || hostname === 'l.instagram.com') return 'instagram'
  if (
    hostname.includes('facebook.') ||
    hostname.includes('fb.com') ||
    hostname.includes('fb.me') ||
    hostname === 'l.facebook.com' ||
    hostname === 'lm.facebook.com'
  ) {
    return 'facebook'
  }
  if (hostname.includes('tiktok.')) return 'tiktok'
  if (hostname.includes('twitter.') || hostname === 't.co' || hostname === 'x.com') return 'twitter'
  if (hostname.includes('linkedin.') || hostname === 'lnkd.in') return 'linkedin'
  if (hostname.includes('youtube.') || hostname === 'youtu.be') return 'youtube'
  if (hostname.includes('google.') || hostname === 'google.com') return 'google'
  if (hostname.includes('bing.')) return 'bing'

  return 'other'
}

export function gameDisplayName(slug: string): string {
  if (slug === 'hub') return 'Academy hub'
  return BRAIN_GAME_CATALOG.find((g) => g.slug === slug)?.name ?? slug
}
