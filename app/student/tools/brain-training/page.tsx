'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { BrainAcademyHub } from '@/components/brain-training/brain-academy-hub'
import { getBrainTrainingLeaderboard } from '@/app/actions/brain-training'

export default function StudentBrainTrainingPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<
    Array<{ name: string; score: number; accuracy: number; level: number }>
  >([])

  useEffect(() => {
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
      void getBrainTrainingLeaderboard('color-word', 10).then(setBoard)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Academy…</p>
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
      />
    </StudentPortalShell>
  )
}
