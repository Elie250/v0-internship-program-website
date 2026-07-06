'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Award } from 'lucide-react'

type Standing = {
  enrollmentId: string
  name: string
  email: string
  submissions: Array<{
    assessmentId: string
    assessmentTitle: string
    score: number | null
    passed: boolean
    attemptCount: number
  }>
  completedQuizzes: number
  totalQuizzes: number
  averageScore: number | null
  eligible: boolean
  certificateCode: string | null
}

export function LecturerResultsPanel({ courseId }: { courseId: string }) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [passingScore, setPassingScore] = useState(70)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [certifying, setCertifying] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lecturer/courses/${courseId}/results`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load results')
      setStandings(data.standings ?? [])
      setPassingScore(Number(data.passingScore ?? 70))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const certify = async (enrollmentId: string, name: string) => {
    if (!confirm(`Confirm passing average and issue certificate for ${name}?`)) return
    setCertifying(enrollmentId)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/lecturer/courses/${courseId}/results`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to issue certificate')
      setMessage(`Certificate issued for ${name} — code ${data.certificateCode}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setCertifying(null)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Results & certification</CardTitle>
        <p className="text-sm text-slate-600">
          When a student completes every assessment with an average of {passingScore}% or higher,
          confirm to generate their certificate automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p> : null}
        {message ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{message}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : standings.length === 0 ? (
          <p className="text-sm text-slate-600">No admitted students yet.</p>
        ) : (
          <ul className="space-y-3">
            {standings.map((student) => (
              <li key={student.enrollmentId} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-600">{student.email}</p>
                    <p className="text-sm text-slate-700 mt-1">
                      {student.completedQuizzes}/{student.totalQuizzes} assessments ·{' '}
                      {student.averageScore != null ? (
                        <span
                          className={cn(
                            'font-semibold',
                            student.averageScore >= passingScore
                              ? 'text-green-700'
                              : 'text-amber-700'
                          )}
                        >
                          average {student.averageScore}%
                        </span>
                      ) : (
                        'no attempts yet'
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {student.certificateCode ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Certified · {student.certificateCode}
                      </Badge>
                    ) : student.eligible ? (
                      <Button
                        size="sm"
                        className="bg-[var(--brand-navy)] text-white"
                        disabled={certifying === student.enrollmentId}
                        onClick={() => certify(student.enrollmentId, student.name)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        {certifying === student.enrollmentId
                          ? 'Issuing…'
                          : 'Confirm pass & issue certificate'}
                      </Button>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-700">Not yet eligible</Badge>
                    )}
                  </div>
                </div>

                {student.submissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {student.submissions.map((sub) => (
                      <Badge
                        key={sub.assessmentId}
                        variant="outline"
                        className={cn(
                          'font-normal',
                          sub.score == null
                            ? 'border-slate-300 text-slate-500'
                            : sub.passed
                              ? 'border-green-300 text-green-800 bg-green-50'
                              : 'border-amber-300 text-amber-900 bg-amber-50'
                        )}
                      >
                        {sub.assessmentTitle}: {sub.score != null ? `${sub.score}%` : '—'}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
