'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

type Eligibility = {
  eligible: boolean
  canStart: boolean
  reason: string | null
  attemptsUsed: number
  maxAttempts: number
  config: {
    durationMinutes: number | null
    questionCount: number | null
    passingScore: number | null
  } | null
  jobTitle: string | null
  activeSessionId: string | null
  latestSession: {
    id: string
    status: string
    technicalScore: number | null
    passed: boolean | null
    completionState: string | null
  } | null
}

type SessionItem = {
  id: string
  sortOrder: number
  questionType: string
  section: string | null
  prompt: string
  options: Array<{ id: string; label: string }>
  parameters: Record<string, number>
  expectedTimeSec: number | null
  answered: boolean
}

type SessionView = {
  session: {
    id: string
    status: string
    remainingMs: number
    expiresAt: string
    questionCount: number
    answeredCount: number
    technicalScore: number | null
    sectionScores: Record<string, { percent: number }> | null
    passed: boolean | null
    completionState: string | null
  }
  items: SessionItem[]
  currentItemId: string | null
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ScreeningFlow({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'briefing' | 'active' | 'review' | 'done'>('briefing')
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [consent, setConsent] = useState(false)
  const [session, setSession] = useState<SessionView | null>(null)
  const [activeItem, setActiveItem] = useState<SessionItem | null>(null)
  const [answer, setAnswer] = useState<Record<string, unknown>>({})
  const [remainingMs, setRemainingMs] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadEligibility = useCallback(async () => {
    const res = await fetch(`/api/recruitment/candidate/applications/${applicationId}/screening`, {
      credentials: 'same-origin',
    })
    if (res.status === 401) {
      router.replace(`/jobs/auth/continue?redirect=/app/applications/${applicationId}/screening`)
      return
    }
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not load assessment')
      setLoading(false)
      return
    }
    setEligibility(data)
    if (data.activeSessionId) {
      setPhase('active')
    } else if (data.latestSession && data.latestSession.status !== 'in_progress') {
      setPhase('done')
    }
    setLoading(false)
  }, [applicationId, router])

  const loadSession = useCallback(async (
    sessionId: string,
    options?: { excludeItemId?: string }
  ) => {
    const res = await fetch(`/api/recruitment/candidate/screening/sessions/${sessionId}`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not load session')
      return null
    }
    setSession(data)
    setRemainingMs(data.session.remainingMs ?? 0)
    if (data.session.status !== 'in_progress') {
      setPhase('done')
      return data
    }
    const excludeId = options?.excludeItemId
    const next =
      data.items.find(
        (i: SessionItem) =>
          i.id === data.currentItemId && i.id !== excludeId && !i.answered
      ) ||
      data.items.find((i: SessionItem) => !i.answered && i.id !== excludeId)
    if (!next) {
      setPhase('review')
      setActiveItem(null)
    } else {
      setActiveItem(next)
      setPhase('active')
      await fetch(
        `/api/recruitment/candidate/screening/sessions/${sessionId}/items/${next.id}/open`,
        { method: 'POST', credentials: 'same-origin' }
      )
    }
    return data
  }, [])

  useEffect(() => {
    void loadEligibility()
  }, [loadEligibility])

  useEffect(() => {
    if (eligibility?.activeSessionId && phase === 'active' && !session) {
      void loadSession(eligibility.activeSessionId)
    }
  }, [eligibility, phase, session, loadSession])

  useEffect(() => {
    if (phase !== 'active' && phase !== 'review') return
    if (!session?.session.expiresAt) return
    const tick = () => {
      const left = Math.max(0, new Date(session.session.expiresAt).getTime() - Date.now())
      setRemainingMs(left)
      if (left <= 0 && session.session.id) {
        void loadSession(session.session.id)
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [phase, session, loadSession])

  useEffect(() => {
    if (!session?.session.id || phase === 'briefing' || phase === 'done') return
    const report = (eventType: string, metadata?: Record<string, unknown>) => {
      void fetch(`/api/recruitment/candidate/screening/sessions/${session.session.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          eventType,
          metadata,
          clientEventAt: new Date().toISOString(),
          sessionItemId: activeItem?.id,
        }),
      })
    }
    const onVis = () =>
      report(document.hidden ? 'visibility_hidden' : 'visibility_visible', {
        visibilityState: document.visibilityState,
      })
    const onBlur = () => report('blur')
    const onFocus = () => report('focus')
    const onCopy = () => report('copy')
    const onPaste = () => report('paste')
    const onPageHide = () => report('page_hide')
    const onPageShow = () => report('page_show')
    const onFs = () =>
      report('fullscreen_change', { fullscreen: Boolean(document.fullscreenElement) })
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [session?.session.id, phase, activeItem?.id])

  const start = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/candidate/screening/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ applicationId, consentAcknowledged: consent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start')
      await loadSession(data.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start')
    } finally {
      setBusy(false)
    }
  }

  const saveAnswer = async () => {
    if (!session || !activeItem || busy) return
    const savingItemId = activeItem.id
    setBusy(true)
    setError('')
    try {
      const res = await fetch(
        `/api/recruitment/candidate/screening/sessions/${session.session.id}/items/${savingItemId}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ answer, clientEventAt: new Date().toISOString() }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save answer')

      // Keep the typed answer until we know the next item — avoids empty re-prompt on the same question
      const refreshed = await loadSession(session.session.id, { excludeItemId: savingItemId })
      if (refreshed && refreshed.session.status === 'in_progress') {
        const unanswered = refreshed.items.filter(
          (i: SessionItem) => !i.answered && i.id !== savingItemId
        )
        if (!unanswered.length || data.allAnswered) {
          setAnswer({})
          setPhase('review')
        } else {
          setAnswer({})
        }
      } else {
        setAnswer({})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save answer')
    } finally {
      setBusy(false)
    }
  }

  const submitAll = async () => {
    if (!session) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(
        `/api/recruitment/candidate/screening/sessions/${session.session.id}/submit`,
        { method: 'POST', credentials: 'same-origin' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit')
      await loadSession(session.session.id)
      setPhase('done')
      await loadEligibility()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <TalentShell title="Technical assessment">
        <LoadingBlock label="Loading assessment…" />
      </TalentShell>
    )
  }

  if (phase === 'done' && (session || eligibility?.latestSession)) {
    const result = session?.session ?? {
      technicalScore: eligibility?.latestSession?.technicalScore ?? null,
      passed: eligibility?.latestSession?.passed ?? null,
      completionState: eligibility?.latestSession?.completionState ?? null,
      sectionScores: null as SessionView['session']['sectionScores'],
    }
    return (
      <TalentShell title="Assessment complete" subtitle={eligibility?.jobTitle ?? undefined}>
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Your responses were recorded. The hiring team will review your technical result.
          </p>
          {result.technicalScore != null ? (
            <p className="text-2xl font-semibold text-[var(--brand-navy)]">
              Technical score: {result.technicalScore}%
            </p>
          ) : null}
          {result.passed != null ? (
            <StatusBanner tone={result.passed ? 'success' : 'info'}>
              {result.passed ? 'Pass criteria met' : 'Pass criteria not met'}
            </StatusBanner>
          ) : null}
          <Link href="/app">
            <Button className="rounded-xl bg-[var(--brand-navy)] text-white">Back to applications</Button>
          </Link>
        </div>
      </TalentShell>
    )
  }

  if (phase === 'briefing') {
    return (
      <TalentShell
        title="Technical assessment"
        subtitle={eligibility?.jobTitle ? `Role: ${eligibility.jobTitle}` : undefined}
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          {!eligibility?.canStart && !eligibility?.activeSessionId ? (
            <>
              <StatusBanner tone="info">{eligibility?.reason || 'Assessment unavailable'}</StatusBanner>
              <Link href="/app" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
                ← Back to applications
              </Link>
            </>
          ) : (
            <>
              <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
                <p>You are about to start a timed technical assessment.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Duration:{' '}
                    {eligibility?.config?.durationMinutes
                      ? `${eligibility.config.durationMinutes} minutes`
                      : 'as configured'}
                  </li>
                  <li>
                    Questions: {eligibility?.config?.questionCount ?? 'as configured'}
                  </li>
                  <li>One question at a time. Answers are saved on the server.</li>
                  <li>Use a desktop computer when possible for the best experience.</li>
                  <li>Attempts used: {eligibility?.attemptsUsed ?? 0} / {eligibility?.maxAttempts ?? 1}</li>
                </ul>
                <p className="text-xs text-slate-500">
                  Browser timers are for display only. The official clock is kept by the server.
                </p>
                <p className="text-xs text-slate-500">
                  During the assessment we may record ordinary browser signals such as tab
                  visibility, focus changes, fullscreen changes, and copy/paste attempts. We do not
                  use your webcam or microphone. These signals help the hiring team review the
                  session fairly and are not a cheating verdict by themselves.
                </p>
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I understand the instructions and am ready to begin. I will complete this assessment
                  myself.
                </span>
              </label>
              <Button
                disabled={!consent || busy}
                onClick={() => void start()}
                className="w-full h-11 rounded-xl bg-[var(--brand-navy)] text-white"
              >
                {busy ? 'Starting…' : eligibility?.activeSessionId ? 'Continue assessment' : 'Start assessment'}
              </Button>
            </>
          )}
        </div>
      </TalentShell>
    )
  }

  if (phase === 'review' && session) {
    return (
      <TalentShell title="Review & submit">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          <p className="text-sm text-slate-600">
            Answered {session.session.answeredCount} of {session.session.questionCount}. Time left:{' '}
            {formatRemaining(remainingMs)}
          </p>
          <Button
            disabled={busy || remainingMs <= 0}
            onClick={() => void submitAll()}
            className="w-full h-11 rounded-xl bg-[var(--brand-navy)] text-white"
          >
            {busy ? 'Submitting…' : 'Submit assessment'}
          </Button>
        </div>
      </TalentShell>
    )
  }

  return (
    <TalentShell title="Technical assessment">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            Question {(activeItem?.sortOrder ?? 0) + 1} of {session?.session.questionCount ?? '—'}
          </p>
          <p className={`text-sm font-semibold tabular-nums ${remainingMs < 60_000 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatRemaining(remainingMs)}
          </p>
        </div>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {activeItem ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            {activeItem.section ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
                {activeItem.section}
              </p>
            ) : null}
            <p className="text-lg font-medium text-slate-900 whitespace-pre-wrap">{activeItem.prompt}</p>

            {activeItem.questionType === 'multiple_choice' ? (
              <div className="space-y-2">
                {activeItem.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm cursor-pointer hover:border-[var(--brand-navy)]/30"
                  >
                    <input
                      type="radio"
                      name="option"
                      checked={answer.optionId === opt.id}
                      onChange={() => setAnswer({ optionId: opt.id })}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {activeItem.questionType === 'multiple_select' ? (
              <div className="space-y-2">
                {activeItem.options.map((opt) => {
                  const selected = Array.isArray(answer.optionIds)
                    ? (answer.optionIds as string[])
                    : []
                  return (
                    <label
                      key={opt.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(opt.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selected, opt.id]
                            : selected.filter((id) => id !== opt.id)
                          setAnswer({ optionIds: next })
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}

            {activeItem.questionType === 'numeric' ? (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="numeric">Your answer</Label>
                <Input
                  id="numeric"
                  type="number"
                  step="any"
                  value={answer.value != null ? String(answer.value) : ''}
                  onChange={(e) =>
                    setAnswer({ value: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            ) : null}

            {activeItem.questionType === 'short_text' ? (
              <div className="space-y-2">
                <Label htmlFor="text">Your answer</Label>
                <Textarea
                  id="text"
                  value={typeof answer.text === 'string' ? answer.text : ''}
                  onChange={(e) => setAnswer({ text: e.target.value })}
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={busy || remainingMs <= 0}
                onClick={() => void saveAnswer()}
                className="rounded-xl bg-[var(--brand-navy)] text-white"
              >
                {busy ? 'Saving…' : 'Save & continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={busy}
                onClick={() => setPhase('review')}
              >
                Review & submit
              </Button>
            </div>
          </div>
        ) : (
          <LoadingBlock label="Loading question…" />
        )}
      </div>
    </TalentShell>
  )
}
