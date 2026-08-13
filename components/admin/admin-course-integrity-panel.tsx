'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { integrityDecisionLabels } from '@/lib/integrity/types'

type AttemptRow = {
  id: string
  assessmentTitle: string
  status: string
  score: number | null
  integrityBand: string | null
  studentName: string
  attemptNumber: number
}

type IntegrityReport = {
  score?: number | null
  integrity?: {
    band: string
    summaryText: string
    recommendation: string
    reasons: Array<{ message: string }>
    eventCount: number
    suggestedActions?: string[]
    decisionGuidance?: string
  }
  timeline?: Array<{ eventType: string; serverReceivedAt: string }>
  reviews?: Array<{ id: string; outcome: string; notes: string | null; created_at: string }>
  student?: { name: string; email: string } | null
}

const OUTCOMES = [
  'accept_attempt',
  'accept_with_caution',
  'require_oral_verification',
  'recommend_void',
  'inconclusive',
  'reviewed',
] as const

export function AdminCourseIntegrityPanel({ courseId }: { courseId: string }) {
  const labels = integrityDecisionLabels('academy')
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [report, setReport] = useState<IntegrityReport | null>(null)
  const [outcome, setOutcome] = useState('accept_attempt')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setError('')
    const res = await fetch(`/api/admin/courses/${courseId}/attempts`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not load attempts')
    else setAttempts(data.attempts ?? [])
  }

  useEffect(() => {
    void load()
  }, [courseId])

  const openReport = async (attemptId: string) => {
    setSelectedId(attemptId)
    setMessage('')
    const res = await fetch(`/api/admin/courses/${courseId}/attempts/${attemptId}/integrity`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not load report')
    else setReport(data)
  }

  const saveReview = async () => {
    if (!selectedId) return
    const res = await fetch(`/api/admin/courses/${courseId}/attempts/${selectedId}/integrity`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, notes }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not save')
    else {
      setMessage(data.message || 'Saved')
      setNotes('')
      await openReport(selectedId)
    }
  }

  const voidAttempt = async () => {
    if (!selectedId) return
    if (
      !window.confirm(
        'Void this attempt manually? Recorded score is kept for audit; it will no longer count as the best attempt.'
      )
    ) {
      return
    }
    const res = await fetch(`/api/admin/courses/${courseId}/attempts/${selectedId}/integrity`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'void', reason: notes || 'Admin manual void' }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not void')
    else {
      setMessage(data.message || 'Voided')
      await load()
      await openReport(selectedId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment integrity (admin)</CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Advisory only — does not change scores or void attempts automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-600">No submitted attempts.</p>
        ) : (
          <ul className="space-y-2 max-h-56 overflow-auto">
            {attempts.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded p-2">
                <span>
                  {row.studentName} · {row.assessmentTitle} · {row.score ?? '—'}% ·{' '}
                  {row.integrityBand ?? 'no band'}
                </span>
                <Button size="sm" variant="outline" onClick={() => void openReport(row.id)}>
                  Report
                </Button>
              </li>
            ))}
          </ul>
        )}
        {report?.integrity ? (
          <div className="rounded-lg border bg-slate-50 p-3 space-y-2 text-sm">
            <p className="font-medium">
              {report.student?.name} · {report.integrity.band}
            </p>
            <p>{report.integrity.summaryText}</p>
            <p className="text-xs text-slate-600">{report.integrity.recommendation}</p>
            <ul className="list-disc pl-5 text-xs text-slate-600">
              {(report.integrity.reasons ?? []).map((r, i) => (
                <li key={i}>{r.message}</li>
              ))}
            </ul>
            <select
              className="h-9 w-full rounded border px-2 text-sm"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {OUTCOMES.map((key) => (
                <option key={key} value={key}>
                  {labels[key]}
                </option>
              ))}
            </select>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Admin notes"
              className="min-h-16"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-[var(--brand-navy)] text-white" onClick={() => void saveReview()}>
                Save decision
              </Button>
              <Button size="sm" variant="outline" onClick={() => void voidAttempt()}>
                Void attempt
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
