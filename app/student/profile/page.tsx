'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, BookOpen } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [profile, setProfile] = useState<{
    firstName?: string
    lastName?: string
    email: string
    phone?: string | null
  } | null>(null)
  const [activePrograms, setActivePrograms] = useState<string[]>([])

  useEffect(() => {
    getStudentPortalData().then((result) => {
      if (!result.success) {
        router.push('/auth/login?redirect=/student/profile')
        return
      }
      const { user, activeCourses, upcomingCourses } = result.data
      setProfile(user)
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
      )
      setActivePrograms([
        ...activeCourses.map((c) => c.title),
        ...upcomingCourses.map((c) => c.title),
      ])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading profile…</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-600 mt-1">{COMPANY.platformName} student account</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-[var(--brand-navy)]" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
                <p className="font-semibold text-slate-900 mt-1">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                  {profile.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone (MoMo)</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                  {profile.phone || 'Not set — update when enrolling'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              <Link href="/auth/forgot-password" className="text-[var(--brand-navy)] underline font-medium">
                Reset your password
              </Link>
              {' '}from the login page, or contact{' '}
              <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] underline">
                {COMPANY.email}
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="h-5 w-5 text-[var(--brand-navy)]" />
              Your programmes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activePrograms.length === 0 ? (
              <p className="text-sm text-slate-600">No active enrollments yet.</p>
            ) : (
              <ul className="space-y-2">
                {activePrograms.map((title) => (
                  <li key={title}>
                    <Badge variant="outline" className="text-slate-800 border-slate-300">
                      {title}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/student/courses?track=training" className="inline-block mt-4">
              <Button size="sm" variant="outline" className="text-slate-900 border-slate-300">
                Browse programmes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </StudentPortalShell>
  )
}
