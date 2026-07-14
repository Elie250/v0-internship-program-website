'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import { getCurrentUser } from '@/app/actions/auth-service'
import { getBrainTrainingLeaderboard } from '@/app/actions/brain-training'
import { ArrowLeft } from 'lucide-react'

export default function PublicBrainTrainingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [board, setBoard] = useState<
    Array<{ name: string; score: number; accuracy: number; level: number }>
  >([])

  useEffect(() => {
    void getCurrentUser().then((u) => {
      const ok = Boolean(u?.id)
      setLoggedIn(ok)
      if (ok) {
        void getBrainTrainingLeaderboard('color-word', 8).then(setBoard)
      }
    })
  }, [])

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 app-form-surface">
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
        />
      </div>
      <SiteFooter />
    </main>
  )
}
