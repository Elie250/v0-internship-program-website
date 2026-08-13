'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Submission = {
  id: string
  score: number | null
  passed: boolean
  lecturer_approved: boolean
  admin_confirmed: boolean
  integrityBand?: string | null
  integrityNeedsReview?: boolean
  best_attempt_id?: string | null
  enrollment?: { applicant_name?: string; applicant_email?: string }
}

export function LecturerAssessmentsPanel({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/lecturer/courses/${courseId}/assessments`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [courseId])

  const approve = async (row: Submission, approved: boolean) => {
    if (
      approved &&
      row.integrityNeedsReview &&
      !window.confirm(
        `Integrity band is ${row.integrityBand}. This is advisory only and will not change the score. Approve anyway? (Open Integrity decision reports below to review the timeline first.)`
      )
    ) {
      return
    }
    await fetch(`/api/lecturer/courses/${courseId}/assessments`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: row.id, approved }),
    })
    void load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment results</CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Integrity bands are advisory. Approving never auto-voids an attempt.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No student submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded border p-3 text-sm flex flex-wrap justify-between gap-2"
              >
                <div>
                  <p className="font-medium">{row.enrollment?.applicant_name ?? 'Student'}</p>
                  <p className="text-slate-600">
                    Score: {row.score ?? '—'}% · {row.passed ? 'Passed' : 'Below pass mark'}
                    {row.integrityBand ? ` · Integrity: ${row.integrityBand}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {row.integrityNeedsReview ? (
                      <Badge className="bg-amber-100 text-amber-900">Integrity review recommended</Badge>
                    ) : null}
                    {row.lecturer_approved ? (
                      <Badge className="bg-green-100 text-green-800">Lecturer approved</Badge>
                    ) : null}
                    {row.admin_confirmed ? (
                      <Badge className="bg-blue-100 text-blue-800">Certificate issued</Badge>
                    ) : null}
                  </div>
                </div>
                {row.passed && !row.lecturer_approved ? (
                  <Button
                    size="sm"
                    className="bg-[var(--brand-navy)] text-white"
                    onClick={() => void approve(row, true)}
                  >
                    Mark pass
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
