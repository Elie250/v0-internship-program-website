'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SequenceMatchGame } from '@/components/brain-training/sequence-match-game'
import { getCurrentUser } from '@/app/actions/auth-service'
import { saveBrainTrainingSession } from '@/app/actions/brain-training'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { ArrowLeft } from 'lucide-react'

export default function SequenceMatchPublicPage() {
  const [canPersist, setCanPersist] = useState(false)

  useEffect(() => {
    void getCurrentUser().then((u) => setCanPersist(Boolean(u?.id)))
  }, [])

  const onPersist = async (result: GameResultPayload) => {
    const res = await saveBrainTrainingSession(result)
    return res.success
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link
          href="/tools/brain-training"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Brain Training Academy
        </Link>
        <SequenceMatchGame
          backHref="/tools/brain-training"
          canPersist={canPersist}
          onPersist={canPersist ? onPersist : undefined}
        />
      </div>
      <SiteFooter />
    </main>
  )
}
