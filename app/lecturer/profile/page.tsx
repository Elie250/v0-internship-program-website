'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, BookOpen } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'

export default function LecturerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [profile, setProfile] = useState<{
    firstName?: string
    lastName?: string
    email: string
    phone?: string | null
    role: string
  } | null>(null)
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; title: string; status: string; program_type?: ProgramType }>
  >([])

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user || (user.role !== 'lecturer' && user.role !== 'instructor')) {
        router.push('/auth/login?role=lecturer&redirect=/lecturer/profile')
        return
      }
      setProfile(user)
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
      )
      const res = await fetch('/api/lecturer/courses', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setProgrammes(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    void init()
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
    <LecturerPortalShell userName={userName}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-600 mt-1">{COMPANY.platformName} lecturer account</p>
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
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
                <p className="font-semibold text-slate-900 mt-1 capitalize">{profile.role}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                  {profile.email}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              <Link href="/auth/forgot-password" className="text-[var(--brand-navy)] underline font-medium">
                Reset your password
              </Link>
              {' '}or contact{' '}
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
              Assigned programmes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programmes.length === 0 ? (
              <p className="text-sm text-slate-600">
                No programmes assigned yet — ask admin to assign you under Programs.
              </p>
            ) : (
              <ul className="space-y-2">
                {programmes.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {PROGRAM_TYPE_LABELS[p.program_type ?? 'training']}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-900'
                        }
                      >
                        {p.status}
                      </Badge>
                      <Link href={`/lecturer/courses/${p.id}`}>
                        <Button size="sm" variant="outline" className="text-slate-900 border-slate-300">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </LecturerPortalShell>
  )
}
