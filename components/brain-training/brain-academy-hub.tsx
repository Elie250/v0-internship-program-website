'use client'

import { useMemo, useState } from 'react'
import { GameCard } from '@/components/brain-training/game-card'
import { Trophy, TrendingUp } from 'lucide-react'
import {
  BRAIN_GAME_CATALOG,
  CATEGORY_FILTERS,
  type BrainGameCategory,
} from '@/lib/brain-training/catalog'
import type { MyBrainProgressRow } from '@/app/actions/brain-training'
import { cn } from '@/lib/utils'

export type CatalogGameRow = {
  slug: string
  thumbnailUrl?: string | null
  isActive?: boolean
}

type LeaderRow = {
  name: string
  score: number
  accuracy: number
  level: number
  game?: string
}

type Props = {
  basePath: string
  showLeaderboard?: boolean
  leaderboard?: LeaderRow[]
  catalogRows?: CatalogGameRow[]
  personalProgress?: MyBrainProgressRow[]
}

export function BrainAcademyHub({
  basePath,
  showLeaderboard,
  leaderboard = [],
  catalogRows = [],
  personalProgress = [],
}: Props) {
  const [filter, setFilter] = useState<BrainGameCategory | 'all'>('all')

  const overlay = useMemo(() => {
    const map = new Map<string, CatalogGameRow>()
    for (const row of catalogRows) map.set(row.slug, row)
    return map
  }, [catalogRows])

  const games = BRAIN_GAME_CATALOG.filter((g) => {
    const row = overlay.get(g.slug)
    if (row && row.isActive === false) return false
    if (filter === 'all') return true
    return g.category === filter
  })

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at 20% 20%, #1d4ed8 0%, transparent 45%), radial-gradient(ellipse at 80% 0%, #0f766e 0%, transparent 40%), linear-gradient(160deg, #020617, #0f172a 60%)',
          }}
        />
        <div className="relative px-6 py-10 md:px-10 md:py-14 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300/90">
            Brain Training Arcade
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">
            Play. Learn. Level up.
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-xl">
            Timed YES/NO arenas for focus, electrical basics, electronics, PLC, embedded logic, and
            code.
          </p>
        </div>
      </section>

      {personalProgress.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[var(--brand-navy)]" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Your bests</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personalProgress.slice(0, 6).map((row) => (
              <a
                key={row.slug}
                href={`${basePath}/${row.slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-[var(--brand-navy)]/40 transition"
              >
                <p className="text-sm font-semibold text-slate-900 truncate">{row.name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Best {row.bestScore} XP · {row.bestAccuracy}% · {row.sessions} runs
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition',
              filter === item.id
                ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {games.map((game) => (
          <GameCard
            key={game.slug}
            game={game}
            href={`${basePath}/${game.slug}`}
            thumbnailUrl={overlay.get(game.slug)?.thumbnailUrl}
          />
        ))}
      </div>

      {showLeaderboard ? (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Top runs</h2>
          </div>
          {leaderboard.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-600">No scores yet — be first on the board.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {leaderboard.map((row, i) => (
                <li
                  key={`${row.name}-${row.game ?? 'drill'}-${i}`}
                  className="px-5 py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {i + 1}. {row.name}
                    {row.game ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">{row.game}</span>
                    ) : null}
                  </span>
                  <span className="text-slate-600 shrink-0">
                    {row.score} XP · L{row.level}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
