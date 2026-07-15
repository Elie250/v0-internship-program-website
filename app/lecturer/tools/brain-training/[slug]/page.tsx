'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryPortalRole, deliveryLoginRoleForUser } from '@/lib/lecturer/delivery-portal'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { QuizYesNoGame } from '@/components/brain-training/quiz-yes-no-game'
import { ColorWordGame } from '@/components/brain-training/color-word-game'
import { SequenceMatchGame } from '@/components/brain-training/sequence-match-game'
import { saveBrainTrainingSession } from '@/app/actions/brain-training'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { getGameDef, isBrainGameSlug } from '@/lib/brain-training/catalog'
import type { QuizBankId } from '@/lib/brain-training/question-banks'

export default function LecturerBrainTrainingSlugPage() {
  const params = useParams()
  const router = useRouter()
  const slug = String(params.slug || '')
  const [userName, setUserName] = useState('')
  const [ready, setReady] = useState(false)

  const def = isBrainGameSlug(slug) ? getGameDef(slug) : undefined

  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (!user || !isDeliveryPortalRole(user.role) || user.role === 'mentor') {
        router.push(
          user?.role === 'mentor'
            ? '/lecturer/dashboard'
            : `/auth/login?role=${deliveryLoginRoleForUser(user?.role ?? 'lecturer')}&redirect=/lecturer/tools/brain-training/${slug}`
        )
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
      )
      setReady(true)
    })
  }, [router, slug])

  if (!def) {
    notFound()
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading drill…</p>
      </div>
    )
  }

  const backHref = '/lecturer/tools/brain-training'
  const onPersist = async (result: GameResultPayload) => {
    try {
      const res = await saveBrainTrainingSession(result)
      return Boolean(res?.success)
    } catch {
      return false
    }
  }

  let drill: ReactNode = null
  if (def.kind === 'quiz' && def.bankId) {
    drill = (
      <QuizYesNoGame
        gameSlug={def.slug}
        bankId={def.bankId as QuizBankId}
        backHref={backHref}
        canPersist
        onPersist={onPersist}
      />
    )
  } else if (def.slug === 'color-word') {
    drill = <ColorWordGame backHref={backHref} canPersist onPersist={onPersist} />
  } else if (def.slug === 'sequence-match') {
    drill = <SequenceMatchGame backHref={backHref} canPersist onPersist={onPersist} />
  } else {
    notFound()
  }

  return (
    <LecturerPortalShell userName={userName}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Arcade
      </Link>
      {drill}
    </LecturerPortalShell>
  )
}
