'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { EngineeringToolsPanel } from '@/components/student/engineering-tools-panel'
import {
  CALCULATOR_FOLDERS,
  CALCULATOR_TOOLS,
} from '@/lib/engineering/calculator-catalog'

const VALID_HASHES = new Set([
  ...CALCULATOR_FOLDERS.map((f) => f.id),
  ...CALCULATOR_TOOLS.map((t) => t.id),
])

export default function StudentCalculatorsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [hashTab, setHashTab] = useState<string | undefined>(undefined)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (VALID_HASHES.has(hash)) setHashTab(hash)

    getStudentPortalData().then((result) => {
      if (!result.success) {
        router.push('/auth/login?redirect=/student/tools/calculators')
        return
      }
      setUserName(
        [result.data.user.firstName, result.data.user.lastName].filter(Boolean).join(' ') ||
          result.data.user.email
      )
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading calculators…</p>
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
      <EngineeringToolsPanel key={hashTab ?? 'folders'} defaultTab={hashTab} />
    </StudentPortalShell>
  )
}
