'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBrainCohortStats, type CohortGameStat } from '@/app/actions/brain-training'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'

type Props = {
  arcadeHref?: string
}

export function BrainCohortPanel({ arcadeHref = '/tools/brain-training' }: Props) {
  const [stats, setStats] = useState<CohortGameStat[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getBrainCohortStats()
      .then((res) => {
        if (!res.success) {
          setError(res.error || 'Could not load cohort stats')
          setStats([])
        } else {
          setStats(res.stats)
        }
      })
      .catch(() => setError('Could not load cohort stats'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">Brain Training · cohort snapshot</CardTitle>
        <p className="text-xs text-slate-600">
          Aggregate accuracy across saved student sessions.{' '}
          <Link href={arcadeHref} className="text-[var(--brand-navy)] underline font-medium">
            Open Arcade
          </Link>
        </p>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
        {error ? <p className="text-sm text-amber-800">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 pr-3">Drill</th>
                  <th className="py-2 pr-3">Attempts</th>
                  <th className="py-2 pr-3">Players</th>
                  <th className="py-2 pr-3">Avg accuracy</th>
                  <th className="py-2">Avg XP</th>
                </tr>
              </thead>
              <tbody>
                {(stats.length
                  ? stats
                  : BRAIN_GAME_CATALOG.map((g) => ({
                      slug: g.slug,
                      name: g.name,
                      attempts: 0,
                      uniquePlayers: 0,
                      avgAccuracy: 0,
                      avgScore: 0,
                    }))
                ).map((row) => (
                  <tr key={row.slug} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{row.attempts}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{row.uniquePlayers}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{row.avgAccuracy}%</td>
                    <td className="py-2.5 text-slate-700">{row.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="text-xs text-slate-500 mt-3">
          Tip: assign a warm-up by sharing the Arcade link before labs. Miss feedback is built into
          engineering drills.
        </p>
      </CardContent>
    </Card>
  )
}
