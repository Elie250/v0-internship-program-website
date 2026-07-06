'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, ExternalLink } from 'lucide-react'

type StudentRow = {
  enrollmentId: string
  courseId: string
  courseTitle: string
  name: string
  email: string
  phone: string | null
  progressPercent: number
  completedLessons: number
  totalLessons: number
  lastActivityAt: string | null
  daysSinceActivity: number | null
  atRisk: boolean
}

export function LecturerStudentsView() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [filter, setFilter] = useState<'all' | 'at-risk'>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/lecturer/students', { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load students')
    setStudents(data.students ?? [])
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user || (user.role !== 'lecturer' && user.role !== 'instructor')) {
        router.push('/auth/login?role=lecturer')
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
      )
      try {
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [router, load])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading students…</p>
      </div>
    )
  }

  const atRiskCount = students.filter((s) => s.atRisk).length
  const visible = filter === 'at-risk' ? students.filter((s) => s.atRisk) : students

  return (
    <LecturerPortalShell userName={userName}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All students</h1>
          <p className="text-sm text-slate-600 mt-1">
            Admitted students across every programme assigned to you.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-[var(--brand-navy)] text-white' : 'text-slate-900'}
            onClick={() => setFilter('all')}
          >
            All ({students.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'at-risk' ? 'default' : 'outline'}
            className={
              filter === 'at-risk'
                ? 'bg-amber-700 text-white hover:bg-amber-800'
                : 'text-slate-900 border-amber-300'
            }
            onClick={() => setFilter('at-risk')}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            At risk ({atRiskCount})
          </Button>
        </div>

        {visible.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center text-slate-600">
              {filter === 'at-risk'
                ? 'No inactive students — great engagement!'
                : 'No admitted students yet across your programmes.'}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">
                {filter === 'at-risk' ? 'Students needing follow-up' : 'Student roster'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                      <th className="py-2 px-4 font-semibold">Name</th>
                      <th className="py-2 px-4 font-semibold">Programme</th>
                      <th className="py-2 px-4 font-semibold">Email</th>
                      <th className="py-2 px-4 font-semibold min-w-[120px]">Progress</th>
                      <th className="py-2 px-4 font-semibold">Last activity</th>
                      <th className="py-2 px-4 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.enrollmentId} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                        <td className="py-3 px-4 text-slate-700">{row.courseTitle}</td>
                        <td className="py-3 px-4 text-slate-600">{row.email}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1 min-w-[100px]">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>
                                {row.completedLessons}/{row.totalLessons}
                              </span>
                              <span>{row.progressPercent}%</span>
                            </div>
                            <Progress value={row.progressPercent} className="h-1.5" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {row.atRisk ? (
                            <Badge className="bg-amber-100 text-amber-900">
                              {row.lastActivityAt
                                ? `${row.daysSinceActivity}d inactive`
                                : 'Never opened'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-600">
                              {row.lastActivityAt
                                ? row.daysSinceActivity === 0
                                  ? 'Today'
                                  : `${row.daysSinceActivity}d ago`
                                : '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/lecturer/courses/${row.courseId}?tab=students`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-navy)] underline"
                          >
                            Open class <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LecturerPortalShell>
  )
}
