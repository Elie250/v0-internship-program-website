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
  enrollment?: { applicant_name?: string }
}

export function AdminAssessmentsPanel({ courseId }: { courseId?: string }) {
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const load = async (id: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/courses/${id}/assessments`, { credentials: 'same-origin' })
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    if (courseId) void load(courseId)
  }, [courseId])

  const confirmCert = async (submissionId: string) => {
    setMessage('')
    const res = await fetch(`/api/admin/assessments/${submissionId}/confirm`, {
      method: 'POST',
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Failed')
      return
    }
    setMessage(`Certificate issued: ${data.certificateCode}`)
    if (courseId) void load(courseId)
  }

  if (!courseId) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Assessments &amp; certificates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="text-sm text-green-800">{message}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions for this programme.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded border p-3 text-sm flex justify-between gap-2 flex-wrap">
              <div>
                <p className="font-medium">{row.enrollment?.applicant_name ?? 'Student'}</p>
                <p className="text-slate-600">
                  {row.score}% · {row.passed ? 'Pass' : 'Fail'}
                  {row.lecturer_approved ? ' · Lecturer OK' : ''}
                  {row.admin_confirmed ? ' · Certified' : ''}
                </p>
              </div>
              {row.passed && row.lecturer_approved && !row.admin_confirmed ? (
                <Button size="sm" onClick={() => confirmCert(row.id)}>
                  Issue certificate
                </Button>
              ) : row.admin_confirmed ? (
                <Badge className="bg-green-100 text-green-800">Issued</Badge>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
