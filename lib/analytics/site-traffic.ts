import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { pathGroupFromPath } from '@/lib/analytics/path-group'
import {
  normalizeTrafficSource,
  type TrafficSource,
} from '@/lib/brain-training/engagement'

export type SiteTrafficTotals = {
  pageviews: number
  uniqueVisitors: number
}

export type SiteSourceRow = {
  source: string
  pageviews: number
  uniqueVisitors: number
}

export type SitePathRow = {
  pathGroup: string
  pageviews: number
}

export type SiteTrafficAnalytics = {
  totals: SiteTrafficTotals
  bySource: SiteSourceRow[]
  byPath: SitePathRow[]
  missingTable?: boolean
  error?: string
}

export async function recordSitePageview(input: {
  path: string
  trafficSource: string
  visitorKey: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const visitorKey = input.visitorKey.trim().slice(0, 80)
  if (visitorKey.length < 8) return { ok: false, error: 'Invalid visitor key' }

  const day = new Date().toISOString().slice(0, 10)
  const pathGroup = pathGroupFromPath(input.path).slice(0, 80)
  const trafficSource = normalizeTrafficSource(input.trafficSource)

  const { data: existing, error: readErr } = await supabaseAdmin
    .from('site_traffic_daily')
    .select('pageviews')
    .eq('day', day)
    .eq('path_group', pathGroup)
    .eq('traffic_source', trafficSource)
    .maybeSingle()

  if (readErr) {
    const missing = /site_traffic_daily|schema cache|does not exist/i.test(readErr.message || '')
    return {
      ok: false,
      error: missing
        ? 'Run scripts/66-site-traffic-analytics.sql in Supabase'
        : readErr.message,
    }
  }

  const nextViews = Number(existing?.pageviews || 0) + 1
  const { error: upsertErr } = await supabaseAdmin.from('site_traffic_daily').upsert(
    {
      day,
      path_group: pathGroup,
      traffic_source: trafficSource,
      pageviews: nextViews,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'day,path_group,traffic_source' }
  )

  if (upsertErr) return { ok: false, error: upsertErr.message }

  await supabaseAdmin.from('site_traffic_visitors').upsert(
    {
      day,
      traffic_source: trafficSource,
      visitor_key: visitorKey,
    },
    { onConflict: 'day,traffic_source,visitor_key', ignoreDuplicates: true }
  )

  return { ok: true }
}

export async function querySiteTrafficAnalytics(days = 30): Promise<SiteTrafficAnalytics> {
  const empty: SiteTrafficAnalytics = {
    totals: { pageviews: 0, uniqueVisitors: 0 },
    bySource: [],
    byPath: [],
  }

  if (!supabaseAdmin) return { ...empty, error: 'Database not configured' }

  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000)
  const sinceDay = since.toISOString().slice(0, 10)

  const { data: daily, error } = await supabaseAdmin
    .from('site_traffic_daily')
    .select('day, path_group, traffic_source, pageviews')
    .gte('day', sinceDay)
    .limit(5000)

  if (error) {
    const missing = /site_traffic_daily|schema cache|does not exist/i.test(error.message || '')
    return {
      ...empty,
      missingTable: missing,
      error: missing
        ? 'Run scripts/66-site-traffic-analytics.sql in Supabase'
        : error.message,
    }
  }

  const { data: visitors } = await supabaseAdmin
    .from('site_traffic_visitors')
    .select('day, traffic_source, visitor_key')
    .gte('day', sinceDay)
    .limit(50000)

  const rows = daily || []
  const visitorRows = visitors || []

  let pageviews = 0
  const sourceViews = new Map<string, number>()
  const pathViews = new Map<string, number>()
  const allVisitors = new Set<string>()
  const sourceVisitors = new Map<string, Set<string>>()

  for (const row of rows) {
    const pv = Number(row.pageviews || 0)
    pageviews += pv
    const src = String(row.traffic_source || 'other')
    const path = String(row.path_group || 'other')
    sourceViews.set(src, (sourceViews.get(src) || 0) + pv)
    pathViews.set(path, (pathViews.get(path) || 0) + pv)
  }

  for (const row of visitorRows) {
    const key = String(row.visitor_key || '')
    const src = String(row.traffic_source || 'other')
    if (!key) continue
    allVisitors.add(key)
    if (!sourceVisitors.has(src)) sourceVisitors.set(src, new Set())
    sourceVisitors.get(src)!.add(key)
  }

  const bySource: SiteSourceRow[] = [...sourceViews.entries()]
    .map(([source, pv]) => ({
      source: source as TrafficSource | string,
      pageviews: pv,
      uniqueVisitors: sourceVisitors.get(source)?.size || 0,
    }))
    .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || b.pageviews - a.pageviews)

  const byPath: SitePathRow[] = [...pathViews.entries()]
    .map(([pathGroup, pv]) => ({ pathGroup, pageviews: pv }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 20)

  return {
    totals: { pageviews, uniqueVisitors: allVisitors.size },
    bySource,
    byPath,
  }
}
