'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { DrillPageShell } from '@/components/brain-training/drill-page-shell'
import { QuizYesNoGame } from '@/components/brain-training/quiz-yes-no-game'
import type { DrillPhase } from '@/components/brain-training/types'
import { getCurrentUser } from '@/app/actions/auth-service'
import { saveBrainTrainingSession } from '@/app/actions/brain-training'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { getGameDef, isBrainGameSlug } from '@/lib/brain-training/catalog'
import type { QuizBankId } from '@/lib/brain-training/question-banks'

export default function BrainTrainingSlugPage() {
  const params = useParams()
  const slug = String(params.slug || '')
  const [canPersist, setCanPersist] = useState(false)
  const [phase, setPhase] = useState<DrillPhase>('intro')

  const def = isBrainGameSlug(slug) ? getGameDef(slug) : undefined

  useEffect(() => {
    void getCurrentUser().then((u) => setCanPersist(Boolean(u?.id)))
  }, [])

  if (!def || def.kind !== 'quiz' || !def.bankId) {
    notFound()
  }

  const onPersist = async (result: GameResultPayload) => {
    try {
      const res = await saveBrainTrainingSession(result)
      return Boolean(res?.success)
    } catch {
      return false
    }
  }

  const focusMode = phase === 'playing' || phase === 'warmup'

  return (
    <DrillPageShell academyHref="/tools/brain-training" focusMode={focusMode}>
      <QuizYesNoGame
        gameSlug={def.slug}
        bankId={def.bankId as QuizBankId}
        backHref="/tools/brain-training"
        canPersist={canPersist}
        onPersist={canPersist ? onPersist : undefined}
        onPhaseChange={setPhase}
      />
    </DrillPageShell>
  )
}
