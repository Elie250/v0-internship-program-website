'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryPortalRole, deliveryLoginRoleForUser } from '@/lib/lecturer/delivery-portal'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { ToolsCenterHub } from '@/components/tools/tools-center-hub'
import { Card, CardContent } from '@/components/ui/card'

export default function LecturerToolsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user || !isDeliveryPortalRole(user.role) || user.role === 'mentor') {
        router.push(
          user?.role === 'mentor'
            ? '/lecturer/dashboard'
            : `/auth/login?role=${deliveryLoginRoleForUser(user?.role ?? 'lecturer')}&redirect=/lecturer/tools`
        )
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
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
    <LecturerPortalShell userName={userName}>
      <ToolsCenterHub
        title="Instructor Tools Center"
        subtitle="Run calculators in class, and try Brain Training drills yourself so you can recommend readiness warm-ups before assessments."
        calculatorsHref="/tools/calculators"
        brainHref="/tools/brain-training"
      />
      <Card className="mt-8 border-slate-200 bg-slate-50">
        <CardContent className="py-4 text-sm text-slate-600">
          Student progress is saved when learners use{' '}
          <Link href="/student/tools/brain-training" className="text-[var(--brand-navy)] font-medium underline">
            My learning → Brain Training
          </Link>
          . Class analytics dashboards can be extended next.
        </CardContent>
      </Card>
    </LecturerPortalShell>
  )
}
