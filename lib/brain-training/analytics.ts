import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import { gameDisplayName, type TrafficSource } from '@/lib/brain-training/engagement'

export type GameEngagementRow = {
  slug: string
  name: string
  opens: number
  completes: number
  uniquePlayers: number
  guestShare: number
}

export type TrafficSourceRow = {
  source: TrafficSource | string
  events: number
  uniqueVisitors: number
}

export type BrainGameAnalytics = {
  totals: {
    hubViews: number
    opens: number
    completes: number
    uniqueVisitors: number
    savedSessions: number
  }
  rankedGames: GameEngagementRow[]
  trafficSources: TrafficSourceRow[]
  missingTable?: boolean
  error?: string
}

type PlayRow = {
  game_slug: string
  event: string
  traffic_source: string
  is_guest: boolean
  visitor_key: string
}

export async function queryBrainGameAnalytics(days = 30): Promise<BrainGameAnalytics> {
  const empty: BrainGameAnalytics = {
    totals: { hubViews: 0, opens: 0, completes: 0, uniqueVisitors: 0, savedSessions: 0 },
    rankedGames: BRAIN_GAME_CATALOG.map((g) => ({
      slug: g.slug,
      name: g.name,
      opens: 0,
      completes: 0,
      uniquePlayers: 0,
      guestShare: 0,
    })),
    trafficSources: [],
  }

  if (!supabaseAdmin) {
    return { ...empty, error: 'Database not configured' }
  }

  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('brain_game_plays')
    .select('game_slug, event, traffic_source, is_guest, visitor_key')
    .gte('created_at', since)
    .limit(20000)

  if (error) {
    const missing = /brain_game_plays|schema cache|does not exist/i.test(error.message || '')
    return {
      ...empty,
      missingTable: missing,
      error: missing
        ? 'Run scripts/65-brain-game-engagement.sql in Supabase'
        : error.message,
    }
  }

  const rows = (data || []) as PlayRow[]
  const visitors = new Set<string>()
  const sourceVisitors = new Map<string, Set<string>>()
  const sourceEvents = new Map<string, number>()

  const byGame = new Map<
    string,
    { opens: number; completes: number; players: Set<string>; guestOpens: number }
  >()

  for (const g of BRAIN_GAME_CATALOG) {
    byGame.set(g.slug, { opens: 0, completes: 0, players: new Set(), guestOpens: 0 })
  }

  let hubViews = 0
  let opens = 0
  let completes = 0

  for (const row of rows) {
    visitors.add(row.visitor_key)

    const src = row.traffic_source || 'other'
    sourceEvents.set(src, (sourceEvents.get(src) || 0) + 1)
    if (!sourceVisitors.has(src)) sourceVisitors.set(src, new Set())
    sourceVisitors.get(src)!.add(row.visitor_key)

    if (row.event === 'hub_view') {
      hubViews += 1
      continue
    }

    const bucket = byGame.get(row.game_slug) ?? {
      opens: 0,
      completes: 0,
      players: new Set<string>(),
      guestOpens: 0,
    }
    if (!byGame.has(row.game_slug)) byGame.set(row.game_slug, bucket)

    if (row.event === 'open') {
      opens += 1
      bucket.opens += 1
      bucket.players.add(row.visitor_key)
      if (row.is_guest) bucket.guestOpens += 1
    } else if (row.event === 'complete') {
      completes += 1
      bucket.completes += 1
      bucket.players.add(row.visitor_key)
    }
  }

  const rankedGames: GameEngagementRow[] = [...byGame.entries()]
    .map(([slug, b]) => ({
      slug,
      name: gameDisplayName(slug),
      opens: b.opens,
      completes: b.completes,
      uniquePlayers: b.players.size,
      guestShare: b.opens > 0 ? Math.round((b.guestOpens / b.opens) * 100) : 0,
    }))
    .sort((a, b) => b.uniquePlayers - a.uniquePlayers || b.opens - a.opens)

  const trafficSources: TrafficSourceRow[] = [...sourceEvents.entries()]
    .map(([source, events]) => ({
      source,
      events,
      uniqueVisitors: sourceVisitors.get(source)?.size || 0,
    }))
    .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || b.events - a.events)

  let savedSessions = 0
  const { count } = await supabaseAdmin
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .gte('attempt_date', since)
  savedSessions = count ?? 0

  return {
    totals: {
      hubViews,
      opens,
      completes,
      uniqueVisitors: visitors.size,
      savedSessions,
    },
    rankedGames,
    trafficSources,
  }
}
