'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { DEFAULT_INTERVIEW_CRITERIA } from '@/lib/recruitment/interview-constants'

export default function EmployerInterviewDetailPage() {
  const params = useParams<{ interviewId: string }>()
  const { orgId } = useEmployerOrg()
  const [interview, setInterview] = useState<{
    id: string
    application_id: string
    interview_type: string
    status: string
    scheduled_at: string
    location: string | null
    meeting_url: string | null
    candidate_instructions: string | null
    internal_notes: string | null
  } | null>(null)
  const [evaluations, setEvaluations] = useState<
    Array<{
      id: string
      recommendation: string | null
      overall_rating: number | null
      feedback: string | null
      status: string
      criteria_scores: Record<string, number>
    }>
  >([])
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_INTERVIEW_CRITERIA.map((c) => [c, 3]))
  )
  const [recommendation, setRecommendation] = useState('neutral')
  const [feedback, setFeedback] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!orgId) return
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/interviews/${params.interviewId}`,
      { credentials: 'same-origin' }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not load interview')
    else {
      setInterview(data.interview)
      setEvaluations(data.evaluations ?? [])
    }
  }

  useEffect(() => {
    void load()
  }, [orgId, params.interviewId])

  const markCompleted = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/interviews/${params.interviewId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'completed' }),
      }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not complete interview')
    else {
      setMessage('Interview marked completed. Application status was not changed automatically.')
      await load()
    }
  }

  const cancelInterview = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/interviews/${params.interviewId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'cancelled' }),
      }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not cancel')
    else await load()
  }

  const saveEvaluation = async (submit: boolean) => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/interviews/${params.interviewId}/evaluations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          criteriaScores: scores,
          recommendation,
          feedback,
          privateNotes,
          submit,
        }),
      }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not save evaluation')
    else {
      setMessage(
        submit
          ? 'Evaluation submitted. This is advisory — HR must update application status separately.'
          : 'Draft evaluation saved.'
      )
      await load()
    }
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Interview</h1>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      {interview ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <p className="text-sm">
            <strong>{new Date(interview.scheduled_at).toLocaleString()}</strong> ·{' '}
            {interview.interview_type.replace('_', ' ')} · {interview.status}
          </p>
          {interview.location ? <p className="text-sm">Location: {interview.location}</p> : null}
          {interview.meeting_url ? <p className="text-sm">Meeting: {interview.meeting_url}</p> : null}
          {interview.candidate_instructions ? (
            <p className="text-sm text-slate-700">{interview.candidate_instructions}</p>
          ) : null}
          {interview.internal_notes ? (
            <p className="text-sm text-slate-500">Internal: {interview.internal_notes}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link href={`/employer/applications/${interview.application_id}`}>
              <Button variant="outline">Open application</Button>
            </Link>
            <Button onClick={() => void markCompleted()} className="bg-[var(--brand-navy)] text-white">
              Mark completed
            </Button>
            <Button variant="outline" onClick={() => void cancelInterview()}>
              Cancel interview
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Interview evaluation (advisory)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ratings never automatically hire or reject a candidate.
          </p>
        </div>
        {DEFAULT_INTERVIEW_CRITERIA.map((criterion) => (
          <label key={criterion} className="flex items-center justify-between gap-3 text-sm">
            <span>{criterion}</span>
            <select
              value={scores[criterion] ?? 3}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [criterion]: Number(e.target.value) }))
              }
              className="h-9 rounded-lg border px-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="block text-sm space-y-1">
          <span>Recommendation</span>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="h-10 w-full rounded-xl border px-3"
          >
            <option value="strong_yes">Strong yes</option>
            <option value="yes">Yes</option>
            <option value="neutral">Neutral</option>
            <option value="no">No</option>
            <option value="strong_no">Strong no</option>
          </select>
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Interviewer feedback"
          className="rounded-xl min-h-24"
        />
        <Textarea
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          placeholder="Private notes (HR only)"
          className="rounded-xl min-h-20"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void saveEvaluation(false)}>
            Save draft
          </Button>
          <Button
            className="bg-[var(--brand-navy)] text-white"
            onClick={() => void saveEvaluation(true)}
          >
            Submit evaluation
          </Button>
        </div>
        {(evaluations ?? []).map((ev) => (
          <div key={ev.id} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p>
              {ev.status} · {ev.recommendation ?? '—'}
              {ev.overall_rating != null ? ` · overall ${ev.overall_rating}` : ''}
            </p>
            {ev.feedback ? <p className="mt-1 text-slate-700">{ev.feedback}</p> : null}
          </div>
        ))}
      </section>
    </EmployerShell>
  )
}
