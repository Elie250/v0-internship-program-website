'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Download, FileSpreadsheet, Users, BookOpen, Award } from 'lucide-react'

type ReportData = {
  courseTitle: string
  generatedAt: string
  summary: {
    totalEnrollments: number
    admitted: number
    pending: number
    rejected: number
    lessonCount: number
    quizCount: number
    passingScore: number
    avgProgress: number
    certified: number
    pendingCertification: number
    eligibleForCertification: number
  }
  quizTitles: Array<{ id: string; title: string }>
  learningStatus: Array<{
    enrollmentId: string
    name: string
    email: string
    phone: string | null
    status: string
    admittedAt: string | null
    completedLessons: number
    totalLessons: number
    progressPercent: number
    quizzesCompleted: number
    totalQuizzes: number
    averageScore: number | null
    certificateStatus: string | null
    certificateCode: string | null
    eligible: boolean
  }>
  marksheet: Array<{
    enrollmentId: string
    name: string
    email: string
    scores: Array<{
      assessmentId: string
      assessmentTitle: string
      score: number | null
      passed: boolean
      attemptCount: number
    }>
    averageScore: number | null
    eligible: boolean
    certificateCode: string | null
    certificateStatus: string | null
  }>
  enrollmentRoster: Array<{
    id: string
    name: string
    email: string
    phone: string | null
    status: string
    amountDue: number
    enrolledAt: string
    admittedAt: string | null
    accessStartsAt: string | null
    accessEndsAt: string | null
  }>
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    admitted: 'bg-green-100 text-green-800',
    payment_pending_review: 'bg-amber-100 text-amber-900',
    payment_rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-200 text-slate-700',
    waitlisted: 'bg-blue-100 text-blue-800',
  }
  return map[status] ?? 'bg-slate-100 text-slate-800'
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString()
}

export function LecturerReportsPanel({ courseId }: { courseId: string }) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lecturer/courses/${courseId}/reports`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load reports')
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const exportLearningStatus = () => {
    if (!report) return
    const rows: string[][] = [
      [
        'Name',
        'Email',
        'Phone',
        'Lessons completed',
        'Total lessons',
        'Progress %',
        'Quizzes done',
        'Total quizzes',
        'Average score',
        'Certificate',
      ],
    ]
    for (const s of report.learningStatus) {
      rows.push([
        s.name,
        s.email,
        s.phone ?? '',
        String(s.completedLessons),
        String(s.totalLessons),
        String(s.progressPercent),
        String(s.quizzesCompleted),
        String(s.totalQuizzes),
        s.averageScore != null ? String(s.averageScore) : '',
        s.certificateCode ?? (s.eligible ? 'Eligible' : '—'),
      ])
    }
    downloadCsv(`${report.courseTitle}-learning-status.csv`, rows)
  }

  const exportMarksheet = () => {
    if (!report) return
    const quizHeaders = report.quizTitles.map((q) => q.title)
    const rows: string[][] = [['Name', 'Email', ...quizHeaders, 'Average %', 'Eligible', 'Certificate']]
    for (const row of report.marksheet) {
      rows.push([
        row.name,
        row.email,
        ...row.scores.map((s) => (s.score != null ? String(s.score) : '')),
        row.averageScore != null ? String(row.averageScore) : '',
        row.eligible ? 'Yes' : 'No',
        row.certificateCode ?? '',
      ])
    }
    downloadCsv(`${report.courseTitle}-marksheet.csv`, rows)
  }

  const exportRoster = () => {
    if (!report) return
    const rows: string[][] = [
      ['Name', 'Email', 'Phone', 'Status', 'Amount due', 'Enrolled', 'Admitted', 'Access starts', 'Access ends'],
    ]
    for (const e of report.enrollmentRoster) {
      rows.push([
        e.name,
        e.email,
        e.phone ?? '',
        e.status,
        String(e.amountDue),
        formatDate(e.enrolledAt),
        formatDate(e.admittedAt),
        formatDate(e.accessStartsAt),
        formatDate(e.accessEndsAt),
      ])
    }
    downloadCsv(`${report.courseTitle}-enrollment-roster.csv`, rows)
  }

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-8 text-center text-slate-600">Loading reports…</CardContent>
      </Card>
    )
  }

  if (error || !report) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-8 text-center text-red-700">{error || 'Reports unavailable'}</CardContent>
      </Card>
    )
  }

  const { summary } = report

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Course reports</h2>
          <p className="text-sm text-slate-600">
            Generated {new Date(report.generatedAt).toLocaleString()} · Passing average {summary.passingScore}%
          </p>
        </div>
        <Button size="sm" variant="outline" className="text-slate-800" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Admitted students
            </p>
            <p className="text-2xl font-bold text-slate-900">{summary.admitted}</p>
            <p className="text-xs text-slate-500">{summary.pending} pending · {summary.rejected} rejected</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Avg. lesson progress
            </p>
            <p className="text-2xl font-bold text-[var(--brand-navy)]">{summary.avgProgress}%</p>
            <p className="text-xs text-slate-500">{summary.lessonCount} lessons · {summary.quizCount} assessments</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Certified
            </p>
            <p className="text-2xl font-bold text-green-700">{summary.certified}</p>
            <p className="text-xs text-slate-500">{summary.pendingCertification} awaiting admin</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Ready to certify</p>
            <p className="text-2xl font-bold text-amber-700">{summary.eligibleForCertification}</p>
            <p className="text-xs text-slate-500">Passed all assessments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="learning" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="learning" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            Learning status
          </TabsTrigger>
          <TabsTrigger value="marksheet" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            Marksheet
          </TabsTrigger>
          <TabsTrigger value="roster" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            Enrolled students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base text-slate-900">Student learning status</CardTitle>
              <Button size="sm" variant="outline" className="text-slate-800" onClick={exportLearningStatus}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {report.learningStatus.length === 0 ? (
                <p className="text-sm text-slate-600">No admitted students yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-700">
                        <th className="py-2 pr-3 font-semibold">Student</th>
                        <th className="py-2 pr-3 font-semibold">Lessons</th>
                        <th className="py-2 pr-3 font-semibold min-w-[120px]">Progress</th>
                        <th className="py-2 pr-3 font-semibold">Assessments</th>
                        <th className="py-2 pr-3 font-semibold">Avg. score</th>
                        <th className="py-2 font-semibold">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.learningStatus.map((s) => (
                        <tr key={s.enrollmentId} className="border-b border-slate-100">
                          <td className="py-3 pr-3">
                            <p className="font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-600">{s.email}</p>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">
                            {s.completedLessons}/{s.totalLessons}
                          </td>
                          <td className="py-3 pr-3">
                            <div className="space-y-1 min-w-[100px]">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>{s.progressPercent}%</span>
                              </div>
                              <Progress value={s.progressPercent} className="h-1.5" />
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">
                            {s.quizzesCompleted}/{s.totalQuizzes}
                          </td>
                          <td className="py-3 pr-3">
                            {s.averageScore != null ? (
                              <span
                                className={cn(
                                  'font-semibold',
                                  s.averageScore >= summary.passingScore
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                )}
                              >
                                {s.averageScore}%
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            {s.certificateStatus === 'issued' ? (
                              <Badge className="bg-green-100 text-green-800">{s.certificateCode}</Badge>
                            ) : s.certificateStatus === 'pending_admin' ? (
                              <Badge className="bg-amber-100 text-amber-900">Pending admin</Badge>
                            ) : s.eligible ? (
                              <Badge className="bg-blue-100 text-blue-800">Eligible</Badge>
                            ) : (
                              <span className="text-slate-500 text-xs">In progress</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marksheet">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Assessment marksheet
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Scores per student per assessment. Passing average: {summary.passingScore}%
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-slate-800 shrink-0" onClick={exportMarksheet}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {report.marksheet.length === 0 ? (
                <p className="text-sm text-slate-600">No admitted students yet.</p>
              ) : report.quizTitles.length === 0 ? (
                <p className="text-sm text-slate-600">No published assessments yet. Create quizzes in the Assessments tab.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-700">
                        <th className="py-2 pr-3 font-semibold sticky left-0 bg-white">Student</th>
                        {report.quizTitles.map((q) => (
                          <th key={q.id} className="py-2 px-2 font-semibold text-center min-w-[80px]">
                            {q.title}
                          </th>
                        ))}
                        <th className="py-2 px-2 font-semibold text-center">Average</th>
                        <th className="py-2 pl-2 font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.marksheet.map((row) => (
                        <tr key={row.enrollmentId} className="border-b border-slate-100">
                          <td className="py-3 pr-3 sticky left-0 bg-white">
                            <p className="font-medium text-slate-900">{row.name}</p>
                            <p className="text-xs text-slate-600">{row.email}</p>
                          </td>
                          {row.scores.map((s) => (
                            <td key={s.assessmentId} className="py-3 px-2 text-center">
                              {s.score != null ? (
                                <span
                                  className={cn(
                                    'font-medium',
                                    s.passed ? 'text-green-700' : 'text-red-700'
                                  )}
                                >
                                  {s.score}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center font-semibold text-slate-900">
                            {row.averageScore != null ? `${row.averageScore}%` : '—'}
                          </td>
                          <td className="py-3 pl-2">
                            {row.certificateStatus === 'issued' ? (
                              <Badge className="bg-green-100 text-green-800">Certified</Badge>
                            ) : row.eligible ? (
                              <Badge className="bg-blue-100 text-blue-800">Pass</Badge>
                            ) : row.averageScore != null ? (
                              <Badge className="bg-amber-100 text-amber-900">Below avg</Badge>
                            ) : (
                              <span className="text-slate-500 text-xs">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base text-slate-900">Enrollment roster</CardTitle>
              <Button size="sm" variant="outline" className="text-slate-800" onClick={exportRoster}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {report.enrollmentRoster.length === 0 ? (
                <p className="text-sm text-slate-600">No enrollments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-700">
                        <th className="py-2 pr-3 font-semibold">Name</th>
                        <th className="py-2 pr-3 font-semibold">Email</th>
                        <th className="py-2 pr-3 font-semibold">Phone</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        <th className="py-2 pr-3 font-semibold">Fee</th>
                        <th className="py-2 pr-3 font-semibold">Enrolled</th>
                        <th className="py-2 font-semibold">Admitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.enrollmentRoster.map((e) => (
                        <tr key={e.id} className="border-b border-slate-100">
                          <td className="py-3 pr-3 font-medium text-slate-900">{e.name}</td>
                          <td className="py-3 pr-3 text-slate-700">{e.email}</td>
                          <td className="py-3 pr-3 text-slate-700">{e.phone ?? '—'}</td>
                          <td className="py-3 pr-3">
                            <Badge className={statusBadgeClass(e.status)}>{e.status}</Badge>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">
                            {e.amountDue > 0 ? `${e.amountDue.toLocaleString()} RWF` : 'Free'}
                          </td>
                          <td className="py-3 pr-3 text-slate-600">{formatDate(e.enrolledAt)}</td>
                          <td className="py-3 text-slate-600">{formatDate(e.admittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
