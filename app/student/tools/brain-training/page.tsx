'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import {
  getBrainGamesForHub,
  getBrainTrainingLeaderboard,
  getMyBrainProgress,
  type MyBrainProgressRow,
} from '@/app/actions/brain-training'

export default function StudentBrainTrainingPage() {
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
    void getBrainGamesForHub()
      .then(setCatalogRows)
      .catch(() => setCatalogRows([]))

    getStudentPortalData().then((result) => {
      if (!result.success) {
        router.push('/auth/login?redirect=/student/tools/brain-training')
        return
      }
      setUserName(
        [result.data.user.firstName, result.data.user.lastName].filter(Boolean).join(' ') ||
          result.data.user.email
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
    <StudentPortalShell userName={userName}>
      <Link
        href="/student/tools"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Tools Center
      </Link>
      <BrainAcademyHub
        basePath="/student/tools/brain-training"
        showLeaderboard
        leaderboard={board}
        catalogRows={catalogRows}
        personalProgress={progress}
      />
    </StudentPortalShell>
  )
}
