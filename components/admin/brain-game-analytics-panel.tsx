'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw } from 'lucide-react'
import type {
  GameEngagementRow,
  TrafficSourceRow,
} from '@/lib/brain-training/analytics'
import type { SitePathRow, SiteSourceRow, SiteTrafficTotals } from '@/lib/analytics/site-traffic'

type Payload = {
  success?: boolean
  days?: number
  totals?: {
    hubViews: number
    opens: number
    completes: number
    uniqueVisitors: number
    savedSessions: number
  }
  rankedGames?: GameEngagementRow[]
  trafficSources?: TrafficSourceRow[]
  site?: {
    totals?: SiteTrafficTotals
    bySource?: SiteSourceRow[]
    byPath?: SitePathRow[]
    missingTable?: boolean
    error?: string
  }
  missingTable?: boolean
  error?: string
}

const SOURCE_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  google: 'Google search',
  bing: 'Bing',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  direct: 'Direct / unknown',
  internal: 'Same site',
  other: 'Other sites',
}

const PATH_LABEL: Record<string, string> = {
  home: 'Home',
  'brain-training': 'Brain Training',
  tools: 'Tools Center',
  learning: 'Learning',
  shop: 'Shop',
  engineering: 'Field Notes',
  library: 'Energy Library',
  apply: 'Apply',
  auth: 'Login / register',
  'student-portal': 'Student portal',
  'lecturer-portal': 'Lecturer portal',
  admin: 'Admin',
  'engineer-portal': 'Engineer portal',
  events: 'Events / webinars',
  legal: 'Legal pages',
}

export default function BrainGameAnalyticsPanel() {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/brain-game-analytics?days=30', { cache: 'no-store' })
      const json = (await res.json()) as Payload
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
      if (json.error) setError(json.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totals = data?.totals
  const site = data?.site
  const ranked = data?.rankedGames || []
  const brainSources = data?.trafficSources || []
  const siteSources = site?.bySource || []
  const sitePaths = site?.byPath || []
  const maxPlayers = Math.max(...ranked.map((r) => r.uniquePlayers), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site & Brain Training analytics</h1>
          <p className="text-slate-600 mt-1 max-w-2xl">
            Free Admin stats (no paid Vercel Analytics). First-party visitor counts disclosed in the
            Privacy Policy — last {data?.days ?? 30} days.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardContent className="py-4 text-sm text-slate-700 space-y-2">
          <p>
            <span className="font-semibold text-slate-900">Optional backup — Cloudflare Web Analytics</span>{' '}
            (free, privacy-friendly, almost no cookies). In Cloudflare → your domain → Analytics →
            Web Analytics → enable, then paste the beacon if prompted. Use it as a second view; Admin
            above stays your in-app source of truth.
          </p>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[var(--brand-navy)] font-medium underline"
          >
            Open Cloudflare dashboard
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-amber-950 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {error}
          {data?.missingTable ? (
            <span className="block mt-1 text-amber-900/80">
              Run in Supabase:{' '}
              <code className="text-xs">scripts/65-brain-game-engagement.sql</code> and{' '}
              <code className="text-xs">scripts/66-site-traffic-analytics.sql</code>
            </span>
          ) : null}
        </p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-slate-600">Loading analytics…</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Website traffic</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 max-w-xl">
              <Stat label="Unique visitors" value={site?.totals?.uniqueVisitors ?? 0} />
              <Stat label="Pageviews" value={site?.totals?.pageviews ?? 0} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Where visitors came from</CardTitle>
                  <p className="text-sm text-slate-500 font-normal">
                    Instagram, Facebook, Google, etc. from referrer / campaign links.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {siteSources.length === 0 ? (
                    <p className="text-sm text-slate-600 py-4">
                      No site traffic yet. After SQL 66 is run, numbers appear as people browse.
                    </p>
                  ) : (
                    siteSources.map((row) => (
                      <SourceRow
                        key={row.source}
                        source={row.source}
                        primary={`${row.uniqueVisitors} visitors`}
                        secondary={`${row.pageviews} pageviews`}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Popular sections</CardTitle>
                  <p className="text-sm text-slate-500 font-normal">Grouped paths (not every URL).</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sitePaths.length === 0 ? (
                    <p className="text-sm text-slate-600 py-4">No section data yet.</p>
                  ) : (
                    sitePaths.map((row) => (
                      <div
                        key={row.pathGroup}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"
                      >
                        <p className="font-medium text-slate-900">
                          {PATH_LABEL[row.pathGroup] || row.pathGroup}
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-slate-900">
                          {row.pageviews}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Brain Training</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Unique players" value={totals?.uniqueVisitors ?? 0} />
              <Stat label="Academy opens" value={totals?.hubViews ?? 0} />
              <Stat label="Game starts" value={totals?.opens ?? 0} />
              <Stat label="Completes" value={totals?.completes ?? 0} />
              <Stat label="Saved scores" value={totals?.savedSessions ?? 0} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Games by population engaged</CardTitle>
                  <p className="text-sm text-slate-500 font-normal">
                    Ranked by unique players. Completes show depth of play.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ranked.every((r) => r.uniquePlayers === 0 && r.opens === 0) ? (
                    <p className="text-sm text-slate-600 py-4">
                      No play data yet (run SQL 65, then wait for plays).
                    </p>
                  ) : (
                    ranked.map((row, i) => (
                      <GameRankRow key={row.slug} rank={i + 1} row={row} maxPlayers={maxPlayers} />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">How they found Brain Training</CardTitle>
                  <p className="text-sm text-slate-500 font-normal">
                    Referrer / UTM on arcade and drill opens.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brainSources.length === 0 ? (
                    <p className="text-sm text-slate-600 py-4">No Brain Training source events yet.</p>
                  ) : (
                    brainSources.map((row) => (
                      <SourceRow
                        key={row.source}
                        source={row.source}
                        primary={`${row.uniqueVisitors} players`}
                        secondary={`${row.events} events`}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function SourceRow({
  source,
  primary,
  secondary,
}: {
  source: string
  primary: string
  secondary: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{SOURCE_LABEL[source] || source}</p>
        <p className="text-xs text-slate-500">{secondary}</p>
      </div>
      <p className="text-lg font-semibold tabular-nums text-slate-900">{primary}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}

function GameRankRow({
  rank,
  row,
  maxPlayers,
}: {
  rank: number
  row: GameEngagementRow
  maxPlayers: number
}) {
  const width = Math.max(4, Math.round((row.uniquePlayers / maxPlayers) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-400 w-5">{rank}</span>
          <p className="font-medium text-slate-900 truncate">{row.name}</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
          {row.uniquePlayers} players
        </p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden ml-7">
        <div
          className="h-full rounded-full bg-[var(--brand-navy)]/80"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 ml-7">
        {row.opens} starts · {row.completes} completes
        {row.opens > 0 ? ` · ${row.guestShare}% guest starts` : ''}
      </p>
    </div>
  )
}
