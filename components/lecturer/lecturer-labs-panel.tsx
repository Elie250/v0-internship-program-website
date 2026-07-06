'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { FlaskConical } from 'lucide-react'

type LabRow = {
  id: string
  title: string
  file_name: string | null
  file_url: string | null
  status: string
  notes: string | null
  course_enrollments?: { applicant_name?: string; applicant_email?: string } | { applicant_name?: string; applicant_email?: string }[]
}

export function LecturerLabsPanel({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<LabRow[]>([])
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const load = () => {
    fetch(`/api/lecturer/courses/${courseId}/labs`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [courseId])

  const review = async (submissionId: string, status: 'reviewed' | 'resubmit') => {
    await fetch(`/api/lecturer/courses/${courseId}/labs`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, status, feedback: feedback[submissionId] ?? '' }),
    })
    load()
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-slate-900">
          <FlaskConical className="h-4 w-4" /> Lab submissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">No lab submissions yet.</p>
        ) : (
          rows.map((r) => {
            const enr = Array.isArray(r.course_enrollments) ? r.course_enrollments[0] : r.course_enrollments
            return (
              <div key={r.id} className="border rounded-lg p-3 space-y-2 text-sm">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <Badge>{r.status}</Badge>
                  <span className="text-slate-600">{enr?.applicant_name ?? 'Student'}</span>
                </div>
                {r.file_url ? (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-navy)] underline text-xs">
                    {r.file_name ?? 'Open file'}
                  </a>
                ) : null}
                {r.notes ? <p className="text-slate-600 text-xs">{r.notes}</p> : null}
                <Textarea
                  rows={2}
                  placeholder="Feedback for student"
                  value={feedback[r.id] ?? ''}
                  onChange={(e) => setFeedback({ ...feedback, [r.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => review(r.id, 'reviewed')}>Mark reviewed</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => review(r.id, 'resubmit')}>Request resubmit</Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
