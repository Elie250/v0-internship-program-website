'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  getBrainGamesForHub,
  getBrainTrainingLeaderboard,
} from '@/app/actions/brain-training'
import { ArrowLeft } from 'lucide-react'

export default function PublicBrainTrainingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [board, setBoard] = useState<
    Array<{ name: string; score: number; accuracy: number; level: number; game?: string }>
  >([])
  const [catalogRows, setCatalogRows] = useState<
    Array<{ slug: string; thumbnailUrl: string | null; isActive: boolean }>
  >([])

  useEffect(() => {
    void getBrainGamesForHub().then(setCatalogRows)
    void getCurrentUser().then((u) => {
      const ok = Boolean(u?.id)
      setLoggedIn(ok)
      if (ok) {
        void Promise.all([
          getBrainTrainingLeaderboard('color-word', 4),
          getBrainTrainingLeaderboard('ohm-law', 4),
          getBrainTrainingLeaderboard('code-trace', 4),
        ]).then(([a, b, c]) => {
          const merged = [
            ...a.map((r) => ({ ...r, game: 'Color-Word' })),
            ...b.map((r) => ({ ...r, game: 'Ohm' })),
            ...c.map((r) => ({ ...r, game: 'Code' })),
          ]
            .sort((x, y) => y.score - x.score)
            .slice(0, 10)
          setBoard(merged)
        })
      }
    })
  }, [])

  return (
    <main className="min-h-screen bg-slate-100">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Tools Center
          </Link>
        </div>
        <BrainAcademyHub
          basePath="/tools/brain-training"
          showLeaderboard={loggedIn}
          leaderboard={board}
          catalogRows={catalogRows}
        />
      </div>
      <SiteFooter />
    </main>
  )
}
