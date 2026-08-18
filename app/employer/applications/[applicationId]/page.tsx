'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { EMPLOYER_PIPELINE_STATUSES } from '@/lib/recruitment/types'
import { formatPipelineLabel } from '@/lib/recruitment/pipeline'
import { INTEGRITY_DECISION_LABELS, TALENT_INTEGRITY_REVIEW_OUTCOMES } from '@/lib/recruitment/screening-integrity-types'

type ScreeningSessionSummary = {
  id: string
  attemptNumber: number
  status: string
  technicalScore: number | null
  sectionScores: Record<string, { percent: number }> | null
  passed: boolean | null
  completionState: string | null
  submittedAt: string | null
  startedAt: string
  integrityBand?: string | null
}

export default function EmployerApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>()
  const router = useRouter()
  const { orgId, canDecide, canInterview } = useEmployerOrg()
  const [data, setData] = useState<{
    application?: {
      id: string
      status: string
      cv_document_id: string | null
      profile_snapshot: Record<string, unknown>
      submitted_at?: string
      job?: { id?: string; title?: string }
    }
    history?: Array<{ id: string; from_status: string | null; to_status: string; created_at: string }>
    notes?: Array<{ id: string; body: string; created_at: string }>
    messages?: Array<{
      id: string
      message_type: string
      subject: string
      body: string
      resource_links: Array<{ label: string; url: string }>
      delivery_status: string
      created_at: string
    }>
  } | null>(null)
  const [interviews, setInterviews] = useState<
    Array<{
      id: string
      interview_type: string
      status: string
      scheduled_at: string
      location: string | null
      meeting_url: string | null
    }>
  >([])
  const [inviteAt, setInviteAt] = useState('')
  const [inviteType, setInviteType] = useState('online')
  const [inviteLocation, setInviteLocation] = useState('')
  const [inviteMeeting, setInviteMeeting] = useState('')
  const [inviteInstructions, setInviteInstructions] = useState('')
  const [inviteNotes, setInviteNotes] = useState('')
  const [screening, setScreening] = useState<{ sessions: ScreeningSessionSummary[] } | null>(null)
  const [review, setReview] = useState<{
    session?: {
      id?: string
      technicalScore?: number | null
      passed?: boolean | null
      integrityBand?: string | null
      completionState?: string | null
    }
    items?: Array<{
      id: string
      prompt: string
      questionType?: string
      scoringStatus: string
      pointsAwarded: number | null
      maxPoints: number
      timeSpentMs: number | null
      expectedTimeSec: number | null
      answer: Record<string, unknown> | null
      guidedMarking?: {
        modelAnswer?: string | null
        keyPoints?: string[]
        markingRubric?: string | null
        useGuidedMarking?: boolean
        autoMarkRationale?: string | null
        autoMarkMethod?: string | null
      } | null
    }>
  } | null>(null)
  const [markDrafts, setMarkDrafts] = useState<
    Record<string, { points: string; note: string; suggestion?: string }>
  >({})
  const [markBusyId, setMarkBusyId] = useState('')
  const [integrity, setIntegrity] = useState<{
    technicalScore?: number | null
    integrity?: {
      band: string
      summaryText: string
      recommendation: string
      reasons: Array<{ message: string }>
      eventCount: number
      categories?: Record<string, number>
      suggestedActions?: string[]
      decisionGuidance?: string
      isCheatingVerdict?: boolean
      doesNotAutoReject?: boolean
    }
    timeline?: Array<{
      eventType: string
      serverReceivedAt: string
      item?: { sortOrder?: number; prompt?: string } | null
    }>
    reviews?: Array<{ id: string; outcome: string; notes: string | null; created_at: string }>
  } | null>(null)
  const [reviewOutcome, setReviewOutcome] = useState('proceed')
  const [reviewNotes, setReviewNotes] = useState('')
  const [activeIntegritySessionId, setActiveIntegritySessionId] = useState('')
  const [aiAnalyses, setAiAnalyses] = useState<
    Array<{
      id: string
      status: string
      analysis_type: string
      model: string | null
      prompt_version: string
      created_at: string
      result?: {
        advisory?: {
          candidateSummary?: string
          technicalStrengths?: string[]
          technicalWeaknesses?: string[]
          openAnswerObservations?: string[]
          cvObservations?: string[]
          suggestedInterviewAreas?: string[]
          integrityContext?: string
          limitations?: string
          disclaimer?: string
        }
        platformFacts?: {
          technicalScore?: number | null
          integrityBand?: string | null
        }
      }
      error_message?: string | null
    }>
  >([])
  const [aiProvider, setAiProvider] = useState<{ available?: boolean; model?: string | null } | null>(
    null
  )
  const [aiBusy, setAiBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [emailType, setEmailType] = useState<'general' | 'request_documents' | 'instructions'>(
    'instructions'
  )
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState(
    'Here is how to proceed:\n\n1. \n2. \n\nIf you have questions, reply to this email.'
  )
  const [emailLinks, setEmailLinks] = useState<Array<{ label: string; url: string }>>([
    { label: '', url: '' },
  ])
  const [emailBusy, setEmailBusy] = useState(false)

  const loadAi = async () => {
    if (!orgId) return
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/ai`,
      { credentials: 'same-origin' }
    )
    if (!res.ok) return
    const body = await res.json()
    setAiAnalyses(body.analyses ?? [])
    setAiProvider(body.provider ?? null)
  }

  const load = async () => {
    if (!orgId) return
    const [appRes, screenRes, interviewRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/applications/${params.applicationId}`, {
        credentials: 'same-origin',
      }),
      fetch(
        `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/screening`,
        { credentials: 'same-origin' }
      ),
      fetch(
        `/api/recruitment/organizations/${orgId}/interviews?applicationId=${params.applicationId}`,
        { credentials: 'same-origin' }
      ),
    ])
    if (appRes.ok) setData(await appRes.json())
    if (screenRes.ok) setScreening(await screenRes.json())
    if (interviewRes.ok) {
      const body = await interviewRes.json()
      setInterviews(body.interviews ?? [])
    }
    await loadAi()
  }

  const inviteInterview = async () => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        applicationId: params.applicationId,
        interviewType: inviteType,
        scheduledAt: inviteAt,
        location: inviteLocation || null,
        meetingUrl: inviteMeeting || null,
        candidateInstructions: inviteInstructions || null,
        internalNotes: inviteNotes || null,
      }),
    })
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not schedule interview')
    else {
      setMessage('Interview invitation created. Application status was not changed automatically.')
      setInviteAt('')
      await load()
    }
  }

  useEffect(() => {
    setIntegrity(null)
    setReview(null)
    setActiveIntegritySessionId('')
    setReviewNotes('')
    setReviewOutcome('proceed')
    void load()
  }, [orgId, params.applicationId])

  useEffect(() => {
    const sessions = screening?.sessions ?? []
    if (!orgId || sessions.length === 0 || activeIntegritySessionId) return
    const preferred =
      sessions.find((s) => s.status === 'submitted' || s.status === 'finalized') ?? sessions[0]
    if (preferred?.id) void openReview(preferred.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when sessions first arrive
  }, [orgId, screening?.sessions, activeIntegritySessionId])

  const setStatus = async (status: string) => {
    setError('')
    setMessage('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status }),
      }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not update status')
    else {
      if (body.warning) setMessage(body.warning)
      else if (status === 'screening') {
        setMessage(
          'Candidate notified to complete the technical assessment (email sent when delivery is configured).'
        )
      }
      await load()
    }
  }

  const removeApplication = async () => {
    if (
      !window.confirm(
        'Remove this application so the candidate can apply again? Assessment attempts and interview records for this application will be deleted.'
      )
    ) {
      return
    }
    setError('')
    setMessage('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}`,
      { method: 'DELETE', credentials: 'same-origin' }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not remove application')
    else {
      router.push('/employer/applications')
    }
  }

  const addNote = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body: note }),
      }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not add note')
    else {
      setNote('')
      await load()
    }
  }

  const applyEmailTemplate = (type: 'general' | 'request_documents' | 'instructions') => {
    setEmailType(type)
    if (type === 'request_documents') {
      setEmailSubject('Action required: additional documents')
      setEmailBody(
        'Please send the following so we can continue reviewing your application:\n\n1. \n2. \n\nReply to this email with the files attached.'
      )
    } else if (type === 'instructions') {
      setEmailSubject('Next steps for your application')
      setEmailBody(
        'Here is how to proceed:\n\n1. \n2. \n\nIf you have questions, reply to this email.'
      )
    } else {
      setEmailSubject('')
      setEmailBody('')
    }
  }

  const sendCandidateEmail = async () => {
    setError('')
    setMessage('')
    setEmailBusy(true)
    try {
      const res = await fetch(
        `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            messageType: emailType,
            subject: emailSubject,
            body: emailBody,
            resourceLinks: emailLinks.filter((item) => item.url.trim()),
          }),
        }
      )
      const body = await res.json()
      if (!res.ok) setError(body.error || 'Could not send email')
      else {
        setMessage('Email sent to the candidate.')
        setEmailLinks([{ label: '', url: '' }])
        await load()
      }
    } finally {
      setEmailBusy(false)
    }
  }

  const openCv = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/cv`,
      { credentials: 'same-origin' }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not open CV')
    else if (body.url) window.open(body.url, '_blank', 'noopener,noreferrer')
  }

  const openReview = async (sessionId: string) => {
    setError('')
    setActiveIntegritySessionId(sessionId)
    const [res, integrityRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/screening/sessions/${sessionId}`, {
        credentials: 'same-origin',
      }),
      fetch(
        `/api/recruitment/organizations/${orgId}/screening/sessions/${sessionId}/integrity`,
        { credentials: 'same-origin' }
      ),
    ])
    const body = await res.json()
    const integrityBody = await integrityRes.json()
    if (!res.ok) setError(body.error || 'Could not load screening review')
    else {
      setReview(body)
      const drafts: Record<string, { points: string; note: string }> = {}
      for (const item of body.items ?? []) {
        if (item.questionType === 'short_text') {
          drafts[item.id] = {
            points: String(item.pointsAwarded ?? ''),
            note: '',
          }
        }
      }
      setMarkDrafts(drafts)
    }
    if (integrityRes.ok) setIntegrity(integrityBody)
    else if (!res.ok) {
      /* keep prior error */
    } else if (!integrityRes.ok) {
      setError(integrityBody.error || 'Could not load integrity report')
    }
  }

  const suggestOpenEndedMark = async (itemId: string) => {
    if (!orgId || !activeIntegritySessionId) return
    setMarkBusyId(itemId)
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/screening/sessions/${activeIntegritySessionId}/items/${itemId}/mark`,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest', preferAi: true }),
      }
    )
    const body = await res.json()
    setMarkBusyId('')
    if (!res.ok) setError(body.error || 'Could not suggest a mark')
    else {
      setMarkDrafts((current) => ({
        ...current,
        [itemId]: {
          points: String(body.suggestion?.suggestedPoints ?? ''),
          note: current[itemId]?.note ?? '',
          suggestion: body.suggestion?.rationale ?? '',
        },
      }))
      setMessage(body.message || 'Suggestion ready — review and apply.')
    }
  }

  const applyOpenEndedMark = async (itemId: string) => {
    if (!orgId || !activeIntegritySessionId) return
    const draft = markDrafts[itemId]
    const points = Number(draft?.points)
    if (!Number.isFinite(points)) {
      setError('Enter points for this open-ended answer.')
      return
    }
    setMarkBusyId(itemId)
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/screening/sessions/${activeIntegritySessionId}/items/${itemId}/mark`,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          pointsAwarded: points,
          note: draft?.note || null,
        }),
      }
    )
    const body = await res.json()
    setMarkBusyId('')
    if (!res.ok) setError(body.error || 'Could not apply mark')
    else {
      setMessage(body.message || 'Mark applied.')
      await openReview(activeIntegritySessionId)
      await load()
    }
  }

  const saveIntegrityReview = async () => {
    if (!activeIntegritySessionId) return
    setError('')
    setMessage('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/screening/sessions/${activeIntegritySessionId}/integrity/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ outcome: reviewOutcome, notes: reviewNotes }),
      }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not save integrity review')
    else {
      setMessage(
        'Integrity decision recorded for the hiring file. Application status was not changed — update pipeline status separately if needed.'
      )
      setReviewNotes('')
      await openReview(activeIntegritySessionId)
    }
  }

  const requestAiAnalysis = async () => {
    setError('')
    setMessage('')
    setAiBusy(true)
    try {
      const res = await fetch(
        `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ analysisType: 'application_advisory' }),
        }
      )
      const body = await res.json()
      if (!res.ok) setError(body.error || 'Could not run AI analysis')
      else {
        setMessage('AI advisory analysis updated. It does not change scores or hiring decisions.')
        await loadAi()
      }
    } finally {
      setAiBusy(false)
    }
  }

  const latestAi = aiAnalyses[0]
  const advisory = latestAi?.result?.advisory
  const aiStatusLabel =
    !latestAi
      ? 'Not analyzed'
      : latestAi.status === 'analyzing'
        ? 'Analyzing'
        : latestAi.status === 'available'
          ? 'Analysis available'
          : latestAi.status === 'failed'
            ? 'Analysis failed'
            : latestAi.status

  const snapshot = data?.application?.profile_snapshot ?? {}
  const latestSession = screening?.sessions?.[0]
  const decisionStatuses = new Set(['offer', 'hired', 'rejected'])

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {String(snapshot.full_name || 'Candidate')}
          </h1>
          <p className="text-sm text-slate-600">
            {data?.application?.job?.title} · Applied{' '}
            {data?.application?.submitted_at
              ? new Date(data.application.submitted_at).toLocaleString()
              : '—'}
          </p>
        </div>
        {data?.application?.job?.id ? (
          <Link href={`/employer/jobs/${data.application.job.id}/compare`}>
            <Button variant="outline">Compare for this job</Button>
          </Link>
        ) : null}
      </div>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? (
        <StatusBanner tone={message.includes('not published') || message.includes('no assessment') ? 'info' : 'success'}>
          {message}
        </StatusBanner>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Candidate profile</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            Pipeline: {data?.application ? formatPipelineLabel(data.application.status) : '—'}
          </span>
          {data?.application?.cv_document_id ? (
            <Button variant="outline" onClick={() => void openCv()}>
              Open CV (signed link)
            </Button>
          ) : (
            <span className="text-sm text-slate-500">No CV attached</span>
          )}
        </div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{String(snapshot.email || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Headline</dt>
            <dd>{String(snapshot.headline || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Location</dt>
            <dd>{String(snapshot.location || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd>{String(snapshot.phone || '—')}</dd>
          </div>
        </dl>
        {snapshot.summary ? (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{String(snapshot.summary)}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">HR decision</h2>
        <p className="text-xs text-slate-500">
          Technical Score, Integrity, AI Advisory, and Interview Evaluation inform HR — they never
          auto-change this decision.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Technical score</p>
            <p className="font-semibold mt-1">
              {latestSession?.technicalScore != null ? `${latestSession.technicalScore}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Integrity (advisory)</p>
            <p className="font-semibold mt-1">{latestSession?.integrityBand ?? '—'}</p>
            <p className="text-[11px] text-slate-500 mt-1">Not an auto-reject</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">AI advisory</p>
            <p className="font-semibold mt-1">{aiStatusLabel}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Interview evaluation</p>
            <p className="font-semibold mt-1">
              {interviews.some((i) => i.status === 'completed') ? 'Recorded' : '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={data?.application?.status ?? ''}
            onChange={(e) => void setStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm"
          >
            {EMPLOYER_PIPELINE_STATUSES.filter((status) => {
              if (status === data?.application?.status) return true
              if (!decisionStatuses.has(status)) return true
              return canDecide
            }).map((status) => (
              <option key={status} value={status}>
                {formatPipelineLabel(status)}
              </option>
            ))}
          </select>
          {!canDecide ? (
            <span className="text-xs text-slate-500">
              Offer / hire / reject require HR or organization admin.
            </span>
          ) : null}
          {canDecide ? (
            <Button
              type="button"
              variant="outline"
              className="text-red-700 border-red-200"
              onClick={() => void removeApplication()}
            >
              Remove application
            </Button>
          ) : null}
        </div>
        {canDecide ? (
          <p className="text-xs text-slate-500">
            Remove application deletes this record so the candidate can apply to the job again
            (useful after a test run).
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Technical score</h2>
        <p className="text-xs text-slate-500">
          Authoritative screening score. Separate from integrity and AI.
        </p>
        {(screening?.sessions ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No screening attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {(screening?.sessions ?? []).map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      Attempt {s.attemptNumber} · {s.status}
                    </p>
                    <p>
                      Technical Score:{' '}
                      {s.technicalScore != null ? `${s.technicalScore}%` : '—'}
                      {s.passed != null ? (s.passed ? ' · pass criteria met' : ' · below threshold') : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void openReview(s.id)}>
                    View results & integrity
                  </Button>
                </div>
                {s.sectionScores ? (
                  <p className="text-xs text-slate-600">
                    Section scores:{' '}
                    {Object.entries(s.sectionScores)
                      .map(([name, val]) => `${name} ${val.percent}%`)
                      .join(' · ')}
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">
                  Started {new Date(s.startedAt).toLocaleString()}
                  {s.submittedAt ? ` · Submitted ${new Date(s.submittedAt).toLocaleString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
        {review?.items ? (
          <div className="rounded-xl bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium">
              Question-level results
              {review.session?.technicalScore != null
                ? ` · ${review.session.technicalScore}%`
                : ''}
              {review.session?.completionState === 'pending_manual'
                ? ' · Open-ended marks pending'
                : ''}
            </p>
            {review.items.map((item, idx) => {
              const answerText =
                item.answer && typeof item.answer.text === 'string' ? item.answer.text : null
              const isOpenEnded = item.questionType === 'short_text'
              const draft = markDrafts[item.id]
              return (
                <div key={item.id} className="text-sm border-t border-slate-200 pt-3 space-y-2">
                  <p className="font-medium">
                    {idx + 1}. {item.prompt}
                  </p>
                  <p className="text-xs text-slate-600">
                    {item.scoringStatus} · {item.pointsAwarded ?? 0}/{item.maxPoints}
                    {item.timeSpentMs != null
                      ? ` · ${(item.timeSpentMs / 1000).toFixed(1)}s`
                      : ''}
                    {item.expectedTimeSec != null ? ` (expected ~${item.expectedTimeSec}s)` : ''}
                  </p>
                  {isOpenEnded ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Candidate answer
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">
                        {answerText?.trim() || '— No text answer recorded —'}
                      </p>
                      {item.guidedMarking?.modelAnswer ? (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Model answer: </span>
                          {item.guidedMarking.modelAnswer}
                        </p>
                      ) : null}
                      {(item.guidedMarking?.keyPoints ?? []).length > 0 ? (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Key points: </span>
                          {item.guidedMarking!.keyPoints!.join(' · ')}
                        </p>
                      ) : null}
                      {item.guidedMarking?.autoMarkRationale ? (
                        <p className="text-xs text-emerald-800">
                          Auto-marked
                          {item.guidedMarking.autoMarkMethod
                            ? ` (${item.guidedMarking.autoMarkMethod})`
                            : ''}
                          : {item.guidedMarking.autoMarkRationale}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-end gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Points</label>
                          <Input
                            className="h-9 w-24 rounded-lg"
                            value={draft?.points ?? ''}
                            onChange={(e) =>
                              setMarkDrafts((current) => ({
                                ...current,
                                [item.id]: {
                                  points: e.target.value,
                                  note: current[item.id]?.note ?? '',
                                  suggestion: current[item.id]?.suggestion,
                                },
                              }))
                            }
                            placeholder={`0–${item.maxPoints}`}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={markBusyId === item.id}
                          onClick={() => void suggestOpenEndedMark(item.id)}
                        >
                          {markBusyId === item.id ? 'Working…' : 'Suggest mark'}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[var(--brand-navy)] text-white"
                          disabled={markBusyId === item.id}
                          onClick={() => void applyOpenEndedMark(item.id)}
                        >
                          Apply mark
                        </Button>
                      </div>
                      {draft?.suggestion ? (
                        <p className="text-xs text-slate-600">{draft.suggestion}</p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Score may already be auto-marked from key points / model answer. Suggest
                          re-runs the marker (AI if configured); Apply overrides the final points.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Integrity decision report</h2>
        <p className="text-xs text-slate-500">
          Advisory report for hiring managers and admins. Browser signals only — not a cheating
          verdict, does not overwrite technical score, and never auto-rejects the candidate.
        </p>
        {integrity?.integrity ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                Review band:{' '}
                <span className="font-semibold tracking-wide">{integrity.integrity.band}</span>
              </p>
              <p className="text-xs text-slate-500">
                Technical score unchanged:{' '}
                {integrity.technicalScore != null ? `${integrity.technicalScore}%` : '—'}
              </p>
            </div>
            <p className="text-sm text-slate-700">{integrity.integrity.summaryText}</p>
            <StatusBanner tone="info">
              {integrity.integrity.decisionGuidance ??
                'Record a human decision below. Pipeline reject remains a separate manual action.'}
            </StatusBanner>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Recommendation: </span>
              {integrity.integrity.recommendation}
            </p>
            {(integrity.integrity.suggestedActions ?? []).length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Suggested next steps
                </p>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                  {integrity.integrity.suggestedActions!.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              {(integrity.integrity.reasons ?? []).map((reason, idx) => (
                <li key={idx}>{reason.message}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              {integrity.integrity.eventCount} browser signal events recorded (server timeline).
            </p>
            {(integrity.timeline ?? []).length > 0 ? (
              <div className="max-h-48 overflow-auto space-y-1 border-t border-slate-200 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Integrity timeline
                </p>
                {(integrity.timeline ?? []).slice(0, 40).map((row, idx) => (
                  <p key={idx} className="text-xs text-slate-600">
                    {new Date(row.serverReceivedAt).toLocaleString()} · {row.eventType}
                    {row.item?.sortOrder != null ? ` · Q${row.item.sortOrder + 1}` : ''}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <p className="text-sm font-medium">Record hiring-manager decision</p>
              <p className="text-xs text-slate-500">
                Saving a decision does not change application status. Use HR decision above to reject
                or advance manually.
              </p>
              <select
                value={reviewOutcome}
                onChange={(e) => setReviewOutcome(e.target.value)}
                className="h-10 w-full max-w-xl rounded-xl border px-3 text-sm"
              >
                {TALENT_INTEGRITY_REVIEW_OUTCOMES.map((key) => (
                  <option key={key} value={key}>
                    {INTEGRITY_DECISION_LABELS[key]}
                  </option>
                ))}
              </select>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notes for the hiring file (why you proceed, caution, or recommend not advancing)"
                className="rounded-xl min-h-20"
              />
              <Button
                onClick={() => void saveIntegrityReview()}
                className="bg-[var(--brand-navy)] text-white"
              >
                Save integrity decision
              </Button>
              {(integrity.reviews ?? []).map((item) => (
                <p key={item.id} className="text-xs text-slate-600">
                  {(INTEGRITY_DECISION_LABELS as Record<string, string>)[item.outcome] ??
                    item.outcome}{' '}
                  · {new Date(item.created_at).toLocaleString()}
                  {item.notes ? ` — ${item.notes}` : ''}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {(screening?.sessions ?? []).length === 0
              ? 'No screening attempt yet — integrity report appears after a session.'
              : 'Loading integrity report… or open a screening attempt above.'}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">AI Analysis — Advisory</h2>
            <p className="text-xs text-slate-500 mt-1">
              Status: {aiStatusLabel}
              {latestAi?.model ? ` · ${latestAi.model}` : ''}
              {latestAi?.prompt_version ? ` · ${latestAi.prompt_version}` : ''}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={aiBusy}
            onClick={() => void requestAiAnalysis()}
          >
            {aiBusy ? 'Analyzing…' : latestAi ? 'Re-run advisory analysis' : 'Request advisory analysis'}
          </Button>
        </div>
        <StatusBanner tone="info">
          AI-generated analysis is advisory and does not determine hiring decisions.
        </StatusBanner>
        {aiProvider && !aiProvider.available ? (
          <p className="text-sm text-slate-600">
            AI provider is not configured on the server. You can continue hiring without AI.
          </p>
        ) : null}
        {latestAi?.status === 'failed' ? (
          <StatusBanner tone="error">
            {latestAi.error_message || 'Analysis failed. Screening and scores are unaffected.'}
          </StatusBanner>
        ) : null}
        {advisory ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <p className="font-medium">Snapshot</p>
              <p>
                Technical Score:{' '}
                {latestAi?.result?.platformFacts?.technicalScore != null
                  ? `${latestAi.result.platformFacts.technicalScore}%`
                  : '—'}
              </p>
              <p>Integrity: {latestAi?.result?.platformFacts?.integrityBand ?? '—'}</p>
              <p>AI Analysis: Advisory</p>
              <p>HR Decision: Pending (human)</p>
            </div>
            {advisory.candidateSummary ? (
              <div>
                <p className="font-medium">Candidate summary</p>
                <p className="text-slate-700 whitespace-pre-wrap">{advisory.candidateSummary}</p>
              </div>
            ) : null}
            {(advisory.technicalStrengths?.length ?? 0) > 0 ? (
              <div>
                <p className="font-medium">Technical strengths</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {advisory.technicalStrengths!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(advisory.technicalWeaknesses?.length ?? 0) > 0 ? (
              <div>
                <p className="font-medium">Technical weaknesses</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {advisory.technicalWeaknesses!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(advisory.openAnswerObservations?.length ?? 0) > 0 ? (
              <div>
                <p className="font-medium">Open-answer observations</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {advisory.openAnswerObservations!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(advisory.cvObservations?.length ?? 0) > 0 ? (
              <div>
                <p className="font-medium">CV / profile observations</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {advisory.cvObservations!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(advisory.suggestedInterviewAreas?.length ?? 0) > 0 ? (
              <div>
                <p className="font-medium">Suggested interview areas</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {advisory.suggestedInterviewAreas!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {advisory.integrityContext ? (
              <div>
                <p className="font-medium">Integrity context</p>
                <p className="text-slate-700 whitespace-pre-wrap">{advisory.integrityContext}</p>
              </div>
            ) : null}
            {advisory.limitations ? (
              <p className="text-xs text-slate-500">{advisory.limitations}</p>
            ) : null}
            <p className="text-xs text-slate-500">
              {advisory.disclaimer ||
                'AI-generated analysis is advisory and does not determine hiring decisions.'}
            </p>
            {aiAnalyses.length > 1 ? (
              <p className="text-xs text-slate-500">
                {aiAnalyses.length} analysis versions on file (latest shown).
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No advisory analysis yet. Request one when you want assistance — it is optional.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Interviews</h2>
          <p className="text-xs text-slate-500 mt-1">
            Interview evaluation is advisory. Completing an interview never auto-hires or rejects.
          </p>
        </div>
        {(interviews ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No interviews scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {interviews.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {new Date(row.scheduled_at).toLocaleString()} ·{' '}
                    {row.interview_type.replace('_', ' ')}
                  </p>
                  <p className="text-slate-600">{row.status}</p>
                </div>
                <Link href={`/employer/interviews/${row.id}`}>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
        {canInterview ? (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <p className="text-sm font-medium">Invite to interview</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm space-y-1">
                <span>Date / time</span>
                <input
                  type="datetime-local"
                  value={inviteAt}
                  onChange={(e) => setInviteAt(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3"
                />
              </label>
              <label className="text-sm space-y-1">
                <span>Type</span>
                <select
                  value={inviteType}
                  onChange={(e) => setInviteType(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3"
                >
                  <option value="online">Online</option>
                  <option value="in_person">In person</option>
                  <option value="phone">Phone</option>
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span>Location</span>
                <input
                  value={inviteLocation}
                  onChange={(e) => setInviteLocation(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3"
                />
              </label>
              <label className="text-sm space-y-1">
                <span>Meeting URL</span>
                <input
                  value={inviteMeeting}
                  onChange={(e) => setInviteMeeting(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3"
                />
              </label>
            </div>
            <Textarea
              value={inviteInstructions}
              onChange={(e) => setInviteInstructions(e.target.value)}
              placeholder="Instructions visible to the candidate"
              className="rounded-xl min-h-20"
            />
            <Textarea
              value={inviteNotes}
              onChange={(e) => setInviteNotes(e.target.value)}
              placeholder="Internal notes (HR only)"
              className="rounded-xl min-h-16"
            />
            <Button
              onClick={() => void inviteInterview()}
              className="bg-[var(--brand-navy)] text-white"
              disabled={!inviteAt}
            >
              Send interview invitation
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Email the candidate</h2>
        <p className="text-xs text-slate-500">
          Sends a customized email for extra documents, next-step instructions, or a general update.
          The candidate can also see it on their talent dashboard. This is separate from internal HR
          notes.
        </p>
        {canInterview ? (
          <>
            <label className="text-sm space-y-1 block">
              <span>Purpose</span>
              <select
                value={emailType}
                onChange={(e) =>
                  applyEmailTemplate(
                    e.target.value as 'general' | 'request_documents' | 'instructions'
                  )
                }
                className="h-10 w-full rounded-xl border px-3"
              >
                <option value="instructions">How to proceed</option>
                <option value="request_documents">Request more documents</option>
                <option value="general">General message</option>
              </select>
            </label>
            <label className="text-sm space-y-1 block">
              <span>Subject</span>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Optional — a default subject is used if empty"
                className="h-11 rounded-xl"
              />
            </label>
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write the message the candidate will receive"
              className="rounded-xl min-h-32"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Document or resource links (optional)</p>
              <p className="text-xs text-slate-500">
                Public https links to forms, packs, or instructions. Do not paste private signed URLs
                that expire immediately.
              </p>
              {emailLinks.map((link, index) => (
                <div key={index} className="grid sm:grid-cols-2 gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      setEmailLinks((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, label: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Label (e.g. Offer pack)"
                    className="h-10 rounded-xl"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) =>
                      setEmailLinks((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item
                        )
                      )
                    }
                    placeholder="https://…"
                    className="h-10 rounded-xl"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmailLinks((current) => [...current, { label: '', url: '' }])}
              >
                Add another link
              </Button>
            </div>
            <Button
              onClick={() => void sendCandidateEmail()}
              className="bg-[var(--brand-navy)] text-white"
              disabled={emailBusy || !emailBody.trim()}
            >
              {emailBusy ? 'Sending…' : 'Send email to candidate'}
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-600">You can review messages sent by the hiring team.</p>
        )}
        <div className="space-y-2 pt-2">
          {(data?.messages ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No emails sent to this candidate yet.</p>
          ) : (
            (data?.messages ?? []).map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
                <p className="font-medium text-slate-900">{item.subject}</p>
                <p className="text-xs text-slate-500">
                  {item.message_type.replace(/_/g, ' ')} · {item.delivery_status} ·{' '}
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-slate-700">{item.body}</p>
                {item.resource_links?.length ? (
                  <ul className="list-disc pl-5 text-slate-700">
                    {item.resource_links.map((link) => (
                      <li key={link.url}>
                        <a href={link.url} className="text-[var(--brand-navy)] hover:underline" target="_blank" rel="noreferrer">
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Internal HR notes</h2>
        <p className="text-xs text-slate-500">Never shown to candidates.</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl min-h-24" />
        <Button onClick={() => void addNote()} className="bg-[var(--brand-navy)] text-white">
          Add note
        </Button>
        <div className="space-y-2">
          {(data?.notes ?? []).map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p>{item.body}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
        <h2 className="font-semibold">Status history</h2>
        {(data?.history ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No status changes recorded yet.</p>
        ) : (
          (data?.history ?? []).map((row) => (
            <p key={row.id} className="text-sm text-slate-700">
              {row.from_status || '—'} → {row.to_status} · {new Date(row.created_at).toLocaleString()}
            </p>
          ))
        )}
      </section>
      <p className="text-sm">
        <Link href="/employer/applications" className="text-[var(--brand-navy)] hover:underline">
          ← Applications
        </Link>
      </p>
    </EmployerShell>
  )
}
