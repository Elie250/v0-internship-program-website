'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { EngineeringToolsPanel } from '@/components/tools/engineering-tools-panel'
import { Card, CardContent } from '@/components/ui/card'

export default function LecturerToolsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user || (user.role !== 'lecturer' && user.role !== 'instructor')) {
        router.push('/auth/login?role=lecturer&redirect=/lecturer/tools')
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
      <EngineeringToolsPanel />
      <Card className="mt-8 border-slate-200 bg-slate-50">
        <CardContent className="py-4 text-sm text-slate-600">
          Use these calculators during lessons or when reviewing student work. The same tools are
          available on the{' '}
          <Link href="/tools" className="text-[var(--brand-navy)] font-medium underline">
            public tools page
          </Link>{' '}
          for students and visitors.
        </CardContent>
      </Card>
    </LecturerPortalShell>
  )
}
