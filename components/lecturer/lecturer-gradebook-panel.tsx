'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

type GradebookData = {
  courseTitle: string
  summary: {
    admitted: number
    avgProgress: number
    quizCount: number
    passingScore: number
  }
  marksheet: Array<{
    enrollmentId: string
    name: string
    email: string
    scores: Array<{
      assessmentTitle: string
      score: number | null
      passed: boolean
    }>
    averageScore: number | null
    eligible: boolean
    certificateCode: string | null
    certificateStatus: string | null
  }>
  learningStatus: Array<{
    enrollmentId: string
    name: string
    progressPercent: number
    completedLessons: number
    totalLessons: number
    attendancePresent?: number
  }>
}

export function LecturerGradebookPanel({ courseId }: { courseId: string }) {
  const [data, setData] = useState<GradebookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reportsRes, attendanceRes] = await Promise.all([
        fetch(`/api/lecturer/courses/${courseId}/reports`, { credentials: 'same-origin' }),
        fetch(`/api/lecturer/courses/${courseId}/attendance/summary`, {
          credentials: 'same-origin',
        }).catch(() => null),
      ])
      const reports = await reportsRes.json()
      if (!reportsRes.ok) throw new Error(reports.error || 'Failed to load gradebook')

      let attendanceByEnrollment = new Map<string, number>()
      if (attendanceRes?.ok) {
        const att = await attendanceRes.json()
        for (const row of att.rows ?? []) {
          attendanceByEnrollment.set(row.enrollmentId, row.presentCount ?? 0)
        }
      }

      setData({
        courseTitle: reports.courseTitle,
        summary: reports.summary,
        marksheet: reports.marksheet ?? [],
        learningStatus: (reports.learningStatus ?? []).map(
          (s: GradebookData['learningStatus'][0]) => ({
            ...s,
            attendancePresent: attendanceByEnrollment.get(s.enrollmentId) ?? 0,
          })
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gradebook')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = () => {
    if (!data) return
    const headers = ['Name', 'Email', 'Progress %', 'Lessons', 'Avg score', 'Attendance', 'Certificate']
    const progressById = new Map(data.learningStatus.map((s) => [s.enrollmentId, s]))
    const rows = data.marksheet.map((m) => {
      const prog = progressById.get(m.enrollmentId)
      return [
        m.name,
        m.email,
        prog?.progressPercent ?? '',
        `${prog?.completedLessons ?? 0}/${prog?.totalLessons ?? 0}`,
        m.averageScore ?? '',
        prog?.attendancePresent ?? 0,
        m.certificateCode ?? '',
      ]
    })
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.courseTitle.replace(/\s+/g, '-')}-gradebook.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-sm text-slate-600 py-6">Loading gradebook…</p>
  if (error) return <p className="text-sm text-red-700 py-6">{error}</p>
  if (!data) return null

  const progressById = new Map(data.learningStatus.map((s) => [s.enrollmentId, s]))

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900">
          <GraduationCap className="h-4 w-4" /> Gradebook
        </CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={exportCsv} className="text-slate-900">
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-slate-600">Admitted</p>
            <p className="text-xl font-bold text-slate-900">{data.summary.admitted}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-slate-600">Avg. progress</p>
            <p className="text-xl font-bold text-[var(--brand-navy)]">{data.summary.avgProgress}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-slate-600">Pass mark</p>
            <p className="text-xl font-bold text-slate-900">{data.summary.passingScore}%</p>
          </div>
        </div>

        {data.marksheet.length === 0 ? (
          <p className="text-sm text-slate-600">No admitted students yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-700">
                  <th className="py-2 pr-3 font-semibold">Student</th>
                  <th className="py-2 pr-3 font-semibold min-w-[120px]">Progress</th>
                  <th className="py-2 pr-3 font-semibold">Quiz avg</th>
                  <th className="py-2 pr-3 font-semibold">Attendance</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.marksheet.map((row) => {
                  const prog = progressById.get(row.enrollmentId)
                  return (
                    <tr key={row.enrollmentId} className="border-b border-slate-100">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="space-y-1 min-w-[100px]">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>
                              {prog?.completedLessons ?? 0}/{prog?.totalLessons ?? 0}
                            </span>
                            <span>{prog?.progressPercent ?? 0}%</span>
                          </div>
                          <Progress value={prog?.progressPercent ?? 0} className="h-1.5" />
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-800">
                        {row.averageScore != null ? `${row.averageScore}%` : '—'}
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {prog?.attendancePresent ?? 0} present
                      </td>
                      <td className="py-3 pr-3">
                        {row.certificateCode ? (
                          <Badge className="bg-green-100 text-green-800">
                            {row.certificateStatus === 'pending_admin' ? 'Cert pending' : 'Certified'}
                          </Badge>
                        ) : row.eligible ? (
                          <Badge className="bg-blue-100 text-blue-800">Eligible</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700">In progress</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
