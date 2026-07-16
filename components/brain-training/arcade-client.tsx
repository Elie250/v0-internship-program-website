'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  getBrainGamesForHub,
  getBrainTrainingLeaderboard,
  getMyBrainProgress,
  type MyBrainProgressRow,
} from '@/app/actions/brain-training'
import { trackBrainEngagement } from '@/lib/brain-training/client-engagement'

type Props = {
  basePath?: string
  toolsHref?: string
}

/**
 * Client island only — parent server page owns SiteHeader/SiteFooter so async
 * RSC footer is never imported into a Client Component (that caused the Arcade crash).
 */
export function BrainArcadeClient({
  basePath = '/tools/brain-training',
  toolsHref = '/tools',
}: Props) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [board, setBoard] = useState<
    Array<{ name: string; score: number; accuracy: number; level: number; game?: string }>
  >([])
  const [catalogRows, setCatalogRows] = useState<
    Array<{ slug: string; thumbnailUrl: string | null; isActive: boolean }>
  >([])
  const [progress, setProgress] = useState<MyBrainProgressRow[]>([])

  useEffect(() => {
    void getBrainGamesForHub()
      .then(setCatalogRows)
      .catch(() => setCatalogRows([]))

    void getCurrentUser()
      .then((u) => {
        const ok = Boolean(u?.id)
        setLoggedIn(ok)
        trackBrainEngagement('hub_view', 'hub', { isGuest: !ok })
        if (!ok) return
        void Promise.all([
          getBrainTrainingLeaderboard('color-word', 4),
          getBrainTrainingLeaderboard('ohm-law', 4),
          getBrainTrainingLeaderboard('code-trace', 4),
        ])
          .then(([a, b, c]) => {
            const merged = [
              ...a.map((r) => ({ ...r, game: 'Color-Word' })),
              ...b.map((r) => ({ ...r, game: 'Ohm' })),
              ...c.map((r) => ({ ...r, game: 'Code' })),
            ]
              .sort((x, y) => y.score - x.score)
              .slice(0, 10)
            setBoard(merged)
          })
          .catch(() => setBoard([]))

        void getMyBrainProgress()
          .then(setProgress)
          .catch(() => setProgress([]))
      })
      .catch(() => setLoggedIn(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="mb-6">
        <Link
          href={toolsHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Tools Center
        </Link>
      </div>
      <BrainAcademyHub
        basePath={basePath}
        showLeaderboard={loggedIn}
        leaderboard={board}
        catalogRows={catalogRows}
        personalProgress={progress}
      />
    </div>
  )
}
