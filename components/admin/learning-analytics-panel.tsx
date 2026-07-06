'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminStatusClass } from '@/components/admin/admin-section-header'

type CourseAnalyticsRow = {
  courseId: string
  title: string
  status: string
  instructorName: string | null
  totalEnrollments: number
  admittedCount: number
  pendingCount: number
  avgProgressPercent: number
  upcomingSessions: number
  pendingCertificates: number
  atRiskStudents: number
}

export function LearningAnalyticsPanel() {
  const [rows, setRows] = useState<CourseAnalyticsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/learning-analytics', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load analytics')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <p className="text-sm text-slate-600">Loading programme analytics…</p>

  if (error) {
    return (
      <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
    )
  }

  if (rows.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-10 text-center text-slate-600">No programmes found.</CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <Card key={row.courseId} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-600">{row.instructorName ?? 'No lecturer assigned'}</p>
                </div>
                <Badge variant="outline" className={adminStatusClass(row.status)}>
                  {row.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">{row.admittedCount}</span> admitted
                </p>
                <p>
                  <span className="font-semibold text-slate-900">{row.avgProgressPercent}%</span> avg progress
                </p>
                <p>
                  <span className="font-semibold text-slate-900">{row.upcomingSessions}</span> upcoming sessions
                </p>
                <p>
                  <span className="font-semibold text-amber-800">{row.pendingCount}</span> pending enrollments
                </p>
              </div>
              {(row.pendingCertificates > 0 || row.atRiskStudents > 0) && (
                <div className="flex flex-wrap gap-2">
                  {row.pendingCertificates > 0 ? (
                    <Badge variant="outline" className={adminStatusClass('payment_pending_review')}>
                      {row.pendingCertificates} cert{row.pendingCertificates === 1 ? '' : 's'} pending
                    </Badge>
                  ) : null}
                  {row.atRiskStudents > 0 ? (
                    <Badge variant="outline" className={adminStatusClass('suspended')}>
                      {row.atRiskStudents} at-risk
                    </Badge>
                  ) : null}
                </div>
              )}
              <Button asChild size="sm" variant="outline" className="w-full border-slate-300 text-slate-800">
                <Link href={`/admin/dashboard/enrollments`}>Manage enrollments</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-800">
              <th className="py-3 px-4 font-semibold">Programme</th>
              <th className="py-3 px-4 font-semibold">Enrollments</th>
              <th className="py-3 px-4 font-semibold">Progress</th>
              <th className="py-3 px-4 font-semibold">Live delivery</th>
              <th className="py-3 px-4 font-semibold">Alerts</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.courseId} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-600">{row.instructorName ?? 'No lecturer'}</p>
                  <Badge variant="outline" className={`mt-1 ${adminStatusClass(row.status)}`}>
                    {row.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-slate-800">
                  <p>
                    <span className="font-semibold text-emerald-800">{row.admittedCount}</span> admitted
                  </p>
                  <p className="text-xs text-slate-600">{row.totalEnrollments} total</p>
                  {row.pendingCount > 0 ? (
                    <p className="text-xs text-amber-800">{row.pendingCount} pending payment</p>
                  ) : null}
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900">{row.avgProgressPercent}%</p>
                  <p className="text-xs text-slate-600">average completion</p>
                  {row.atRiskStudents > 0 ? (
                    <p className="text-xs text-red-800 mt-1">{row.atRiskStudents} inactive / at risk</p>
                  ) : null}
                </td>
                <td className="py-3 px-4 text-slate-800">
                  {row.upcomingSessions} upcoming session{row.upcomingSessions === 1 ? '' : 's'}
                </td>
                <td className="py-3 px-4">
                  {row.pendingCertificates > 0 ? (
                    <Badge variant="outline" className={adminStatusClass('payment_pending_review')}>
                      {row.pendingCertificates} certificate{row.pendingCertificates === 1 ? '' : 's'}
                    </Badge>
                  ) : (
                    <span className="text-slate-500 text-xs">None</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-800">
                      <Link href="/admin/dashboard/enrollments">Enrollments</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="text-[var(--brand-navy)]">
                      <Link href="/admin/dashboard/classroom">Sessions</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
