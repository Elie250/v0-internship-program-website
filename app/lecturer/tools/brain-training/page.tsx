'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryPortalRole, deliveryLoginRoleForUser } from '@/lib/lecturer/delivery-portal'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import {
  getBrainTrainingLeaderboard,
  getMyBrainProgress,
  type MyBrainProgressRow,
} from '@/app/actions/brain-training'

export default function LecturerBrainTrainingPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<
    Array<{ name: string; score: number; accuracy: number; level: number; game?: string }>
  >([])
  const [catalogRows, setCatalogRows] = useState<
    Array<{ slug: string; thumbnailUrl: string | null; isActive: boolean }>
  >([])
  const [progress, setProgress] = useState<MyBrainProgressRow[]>([])

  useEffect(() => {
    void fetch('/api/public/brain-games', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { games?: Array<{ slug: string; thumbnailUrl: string | null; isActive: boolean }> }) => {
        setCatalogRows(Array.isArray(data.games) ? data.games : [])
      })
      .catch(() => setCatalogRows([]))

    void getCurrentUser().then((user) => {
      if (!user || !isDeliveryPortalRole(user.role) || user.role === 'mentor') {
        router.push(
          user?.role === 'mentor'
            ? '/lecturer/dashboard'
            : `/auth/login?role=${deliveryLoginRoleForUser(user?.role ?? 'lecturer')}&redirect=/lecturer/tools/brain-training`
        )
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
      )
      setLoading(false)
      void Promise.all([
        getBrainTrainingLeaderboard('color-word', 4),
        getBrainTrainingLeaderboard('ohm-law', 4),
        getBrainTrainingLeaderboard('plc-ladder', 4),
        getMyBrainProgress(),
      ])
        .then(([a, b, c, mine]) => {
          const merged = [
            ...a.map((r) => ({ ...r, game: 'Color-Word' })),
            ...b.map((r) => ({ ...r, game: 'Ohm' })),
            ...c.map((r) => ({ ...r, game: 'PLC' })),
          ]
            .sort((x, y) => y.score - x.score)
            .slice(0, 10)
          setBoard(merged)
          setProgress(mine)
        })
        .catch(() => {
          setBoard([])
          setProgress([])
        })
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Arcade…</p>
      </div>
    )
  }

  return (
    <LecturerPortalShell userName={userName}>
      <Link
        href="/lecturer/tools"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Tools Center
      </Link>
      <p className="text-sm text-slate-600 mb-4 max-w-2xl">
        Play the same Arcade your students use — try drills yourself, then recommend warm-ups before
        labs. Your scores save to your instructor profile.
      </p>
      <BrainAcademyHub
        basePath="/lecturer/tools/brain-training"
        showLeaderboard
        leaderboard={board}
        catalogRows={catalogRows}
        personalProgress={progress}
      />
    </LecturerPortalShell>
  )
}
