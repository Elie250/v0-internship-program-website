'use client'

import { useEffect, useState } from 'react'
import { DrillPageShell } from '@/components/brain-training/drill-page-shell'
import { ColorWordGame } from '@/components/brain-training/color-word-game'
import type { DrillPhase } from '@/components/brain-training/types'
import { getCurrentUser } from '@/app/actions/auth-service'
import { saveBrainTrainingSession } from '@/app/actions/brain-training'
import type { GameResultPayload } from '@/lib/brain-training/scoring'

export default function ColorWordPublicPage() {
  const [canPersist, setCanPersist] = useState(false)
  const [phase, setPhase] = useState<DrillPhase>('intro')

  useEffect(() => {
    void getCurrentUser().then((u) => setCanPersist(Boolean(u?.id)))
  }, [])

  const onPersist = async (result: GameResultPayload) => {
    const res = await saveBrainTrainingSession(result)
    return res.success
  }

  const focusMode = phase === 'playing' || phase === 'warmup'

  return (
    <DrillPageShell academyHref="/tools/brain-training" focusMode={focusMode}>
      <ColorWordGame
        backHref="/tools/brain-training"
        canPersist={canPersist}
        onPersist={canPersist ? onPersist : undefined}
        onPhaseChange={setPhase}
      />
    </DrillPageShell>
  )
}
