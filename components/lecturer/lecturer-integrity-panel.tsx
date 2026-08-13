'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { integrityDecisionLabels } from '@/lib/integrity/types'

type AttemptRow = {
  id: string
  assessmentTitle: string
  status: string
  score: number | null
  passed: boolean | null
  attemptNumber: number
  submittedAt: string | null
  integrityBand: string | null
  studentName: string
  studentEmail: string | null
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
  attempt?: { status: string; attemptNumber: number; assessmentTitle?: string }
  student?: { name: string; email: string } | null
  error?: string
}

const ACADEMY_OUTCOMES = [
  'accept_attempt',
  'accept_with_caution',
  'require_oral_verification',
  'recommend_void',
  'no_concern',
  'inconclusive',
  'reviewed',
] as const

function bandTone(band: string | null) {
  if (band === 'HIGH_CONCERN') return 'bg-amber-100 text-amber-900'
  if (band === 'REVIEW') return 'bg-amber-50 text-amber-800'
  if (band === 'LOW_CONCERN') return 'bg-slate-100 text-slate-700'
  if (band === 'NORMAL') return 'bg-emerald-50 text-emerald-800'
  return 'bg-slate-50 text-slate-500'
}

export function LecturerIntegrityPanel({ courseId }: { courseId: string }) {
  const labels = integrityDecisionLabels('academy')
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [report, setReport] = useState<IntegrityReport | null>(null)
  const [outcome, setOutcome] = useState<string>('accept_attempt')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadAttempts = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/lecturer/courses/${courseId}/attempts`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not load attempts')
    else {
      setAttempts(data.attempts ?? [])
      setHint(data.hint ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadAttempts()
  }, [courseId])

  const openReport = async (attemptId: string) => {
    setSelectedId(attemptId)
    setMessage('')
    setError('')
    setReport(null)
    const res = await fetch(
      `/api/lecturer/courses/${courseId}/attempts/${attemptId}/integrity`,
      { credentials: 'same-origin' }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not load integrity report')
    else setReport(data)
  }

  const saveReview = async () => {
    if (!selectedId) return
    setBusy(true)
    setError('')
    setMessage('')
    const res = await fetch(
      `/api/lecturer/courses/${courseId}/attempts/${selectedId}/integrity`,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review', outcome, notes }),
      }
    )
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Could not save review')
    else {
      setMessage(data.message || 'Review saved')
      setNotes('')
      await openReport(selectedId)
    }
  }

  const voidAttempt = async () => {
    if (!selectedId) return
    if (
      !window.confirm(
        'Void this attempt manually? The recorded score stays for audit, but it will no longer count as the best attempt for standings/certificates.'
      )
    ) {
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch(
      `/api/lecturer/courses/${courseId}/attempts/${selectedId}/integrity`,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void', reason: notes || 'Manual void after integrity review' }),
      }
    )
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Could not void attempt')
    else {
      setMessage(data.message || 'Attempt voided')
      await loadAttempts()
      await openReport(selectedId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrity decision reports</CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Advisory browser-signal reports for lecturers. Not a cheating verdict — never auto-voids
          or changes scores. Run migration{' '}
          <code className="text-[11px]">80-academy-assessment-integrity-bands.sql</code> if bands
          are missing.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading attempts…</p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submitted attempts yet.</p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-auto">
            {attempts.map((row) => (
              <li
                key={row.id}
                className="rounded border p-3 text-sm flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-medium">{row.studentName}</p>
                  <p className="text-slate-600">
                    {row.assessmentTitle} · Attempt {row.attemptNumber} ·{' '}
                    {row.score != null ? `${row.score}%` : '—'} · {row.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${bandTone(row.integrityBand)}`}
                  >
                    {row.integrityBand ?? 'no band'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => void openReport(row.id)}>
                    Open report
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {report?.integrity ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {report.student?.name ?? 'Student'} ·{' '}
                <Badge className={bandTone(report.integrity.band)}>{report.integrity.band}</Badge>
              </p>
              <p className="text-xs text-slate-500">
                Score unchanged: {report.score != null ? `${report.score}%` : '—'}
              </p>
            </div>
            <p className="text-sm text-slate-700">{report.integrity.summaryText}</p>
            <p className="text-xs text-slate-600">{report.integrity.decisionGuidance}</p>
            <p className="text-sm">
              <span className="font-medium">Recommendation: </span>
              {report.integrity.recommendation}
            </p>
            {(report.integrity.suggestedActions ?? []).length > 0 ? (
              <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                {report.integrity.suggestedActions!.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            ) : null}
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              {(report.integrity.reasons ?? []).map((reason, idx) => (
                <li key={idx}>{reason.message}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              {report.integrity.eventCount} browser signal events recorded.
            </p>
            {(report.timeline ?? []).length > 0 ? (
              <div className="max-h-40 overflow-auto border-t border-slate-200 pt-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Timeline
                </p>
                {(report.timeline ?? []).slice(0, 40).map((row, idx) => (
                  <p key={idx} className="text-xs text-slate-600">
                    {new Date(row.serverReceivedAt).toLocaleString()} · {row.eventType}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <p className="text-sm font-medium">Record lecturer decision</p>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="h-10 w-full max-w-xl rounded-xl border px-3 text-sm"
              >
                {ACADEMY_OUTCOMES.map((key) => (
                  <option key={key} value={key}>
                    {labels[key]}
                  </option>
                ))}
              </select>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for the academic file"
                className="min-h-20"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  onClick={() => void saveReview()}
                  className="bg-[var(--brand-navy)] text-white"
                >
                  Save integrity decision
                </Button>
                <Button disabled={busy} variant="outline" onClick={() => void voidAttempt()}>
                  Manually void attempt
                </Button>
              </div>
              {(report.reviews ?? []).map((item) => (
                <p key={item.id} className="text-xs text-slate-600">
                  {labels[item.outcome as keyof typeof labels] ?? item.outcome} ·{' '}
                  {new Date(item.created_at).toLocaleString()}
                  {item.notes ? ` — ${item.notes}` : ''}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
