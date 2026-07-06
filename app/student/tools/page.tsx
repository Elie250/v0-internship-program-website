'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { EngineeringToolsPanel } from '@/components/student/engineering-tools-panel'
import { Card, CardContent } from '@/components/ui/card'

export default function StudentToolsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentPortalData().then((result) => {
      if (!result.success) {
        router.push('/auth/login?redirect=/student/tools')
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
        <p className="text-slate-600">Loading tools…</p>
      </div>
    )
  }

  return (
    <StudentPortalShell userName={userName}>
      <EngineeringToolsPanel />
      <Card className="mt-8 border-slate-200 bg-slate-50">
        <CardContent className="py-4 text-sm text-slate-600">
          Need human help on a live project?{' '}
          <Link href="/engineering-support" className="text-[var(--brand-navy)] font-medium underline">
            Engineering support
          </Link>{' '}
          includes community Q&amp;A and optional paid engineer review.
        </CardContent>
      </Card>
    </StudentPortalShell>
  )
}
