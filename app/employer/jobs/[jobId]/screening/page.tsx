'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import {
  allocateCountsFromMix,
  describeTypeMixCounts,
  normalizeQuestionTypeMix,
} from '@/lib/recruitment/question-type-mix'
import {
  formatPerQuestionTime,
  secondsPerQuestionFromDuration,
} from '@/lib/recruitment/screening-timing'

export default function JobScreeningPage() {
  const params = useParams<{ jobId: string }>()
  const { orgId, canWriteScreening } = useEmployerOrg()
  const [jobTitle, setJobTitle] = useState('')
  const [config, setConfig] = useState({
    enabled: false,
    status: 'draft',
    durationMinutes: '60',
    questionCount: '10',
    categories: '',
    passingScore: '70',
    sectionMinimums: '',
    passingCriteria: '',
    attemptPolicy: 'single',
    questionSelection: 'manual',
    randomized: true,
    dynamicParameters: true,
    perQuestionTimeSeconds: '90',
    integrityMonitoring: false,
    mixMultiple: '50',
    mixShort: '30',
    mixOpen: '20',
    candidateInstructions: '',
  })
  const [questions, setQuestions] = useState<
    Array<{ id: string; prompt: string; owner_type: string; question_type?: string; section?: string }>
  >([])
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<{
    items?: Array<{ prompt?: string; questionType?: string }>
    sampleNote?: string
    questionSelection?: string
  } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const isPublished = config.status === 'published'
  const isAutoBank = config.questionSelection === 'random_from_bank'

  const mixPreview = useMemo(() => {
    const total = Math.max(0, Number(config.questionCount) || 0)
    const mix = normalizeQuestionTypeMix({
      multiple: Number(config.mixMultiple),
      short: Number(config.mixShort),
      open: Number(config.mixOpen),
    })
    return {
      mix,
      counts: allocateCountsFromMix(total, mix),
      label: describeTypeMixCounts(total, mix),
    }
  }, [config.questionCount, config.mixMultiple, config.mixShort, config.mixOpen])

  const load = async () => {
    if (!orgId) return
    const [cfgRes, qRes, jobRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
        credentials: 'same-origin',
      }),
      fetch(`/api/recruitment/organizations/${orgId}/questions`, { credentials: 'same-origin' }),
      fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}`, {
        credentials: 'same-origin',
      }),
    ])
    const cfg = await cfgRes.json()
    const qs = await qRes.json()
    const jobData = await jobRes.json()
    if (jobRes.ok && jobData.job?.title) setJobTitle(String(jobData.job.title))
    if (cfg.config) {
      const mins = cfg.config.section_minimums ?? {}
      const mix = normalizeQuestionTypeMix(cfg.config.question_type_mix)
      setConfig((current) => ({
        ...current,
        enabled: Boolean(cfg.config.enabled),
        status: cfg.config.status ?? 'draft',
        durationMinutes: String(cfg.config.duration_minutes ?? '60'),
        questionCount: String(cfg.config.question_count ?? '10'),
        categories: Array.isArray(cfg.config.categories) ? cfg.config.categories.join(', ') : '',
        passingScore: String(cfg.config.passing_score ?? '70'),
        sectionMinimums: Object.entries(mins)
          .map(([k, v]) => `${k}:${v}`)
          .join(', '),
        passingCriteria: cfg.config.passing_criteria ?? '',
        attemptPolicy: cfg.config.attempt_policy ?? 'single',
        questionSelection: cfg.config.question_selection ?? 'manual',
        randomized: cfg.config.randomized !== false,
        dynamicParameters: Boolean(cfg.config.dynamic_parameters),
        perQuestionTimeSeconds: String(cfg.config.per_question_time_seconds ?? '90'),
        integrityMonitoring: Boolean(cfg.config.integrity_monitoring),
        mixMultiple: String(mix.multiple),
        mixShort: String(mix.short),
        mixOpen: String(mix.open),
        candidateInstructions: String(cfg.config.candidate_instructions ?? ''),
      }))
      if (cfg.config.instructions_schema_missing) {
        setError(
          'Pre-instructions cannot be stored until you run scripts/84-recruitment-assessment-instructions.sql in Supabase SQL Editor.'
        )
      }
    }
    setSelected(
      ((cfg.items ?? []) as Array<{ question_id: string }>)
        .map((item) => item.question_id)
        .filter((id: string) => (qs.questions ?? []).some((q: { id: string }) => q.id === id))
    )
    setQuestions(qs.questions ?? [])
  }

  useEffect(() => {
    void load()
  }, [orgId, params.jobId])

  const parseSectionMinimums = () => {
    const out: Record<string, number> = {}
    for (const part of config.sectionMinimums.split(',')) {
      const [k, v] = part.split(':').map((s) => s.trim())
      if (k && v != null && v !== '' && !Number.isNaN(Number(v))) out[k] = Number(v)
    }
    return out
  }

  const save = async (mode: 'draft' | 'publish' | 'unpublish') => {
    setError('')
    setMessage('')
    setPreview(null)
    if (mode === 'publish' && !isAutoBank && selected.length === 0) {
      setError(
        'Select at least one question below before publishing. Add questions in the question bank first if the list is empty.'
      )
      return
    }
    if (mode === 'publish' && isAutoBank && questions.length === 0) {
      setError('Add questions to the question bank before publishing with auto-select.')
      return
    }
    setBusy(true)
    const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        enabled: mode === 'unpublish' ? false : config.enabled || mode === 'publish',
        durationMinutes: Number(config.durationMinutes),
        questionCount: Number(config.questionCount),
        categories: config.categories
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        passingScore: Number(config.passingScore),
        sectionMinimums: parseSectionMinimums(),
        passingCriteria: config.passingCriteria,
        candidateInstructions: config.candidateInstructions,
        attemptPolicy: config.attemptPolicy,
        questionSelection: config.questionSelection,
        randomized: config.randomized,
        dynamicParameters: config.dynamicParameters,
        perQuestionTimeSeconds: Number(config.perQuestionTimeSeconds),
        integrityMonitoring: config.integrityMonitoring,
        questionTypeMix: {
          multiple: Number(config.mixMultiple),
          short: Number(config.mixShort),
          open: Number(config.mixOpen),
        },
        questionIds: isAutoBank ? [] : selected,
        bankQuestionCount: questions.length,
        publish: mode === 'publish',
        status: mode === 'unpublish' ? 'draft' : mode === 'publish' ? 'published' : undefined,
      }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Save failed')
    else {
      setMessage(
        mode === 'publish'
          ? 'Assessment published. Invite candidates by setting their application status to Screening.'
          : mode === 'unpublish'
            ? 'Assessment unpublished. Candidates can no longer start new attempts.'
            : 'Draft saved. Publish when you are ready for candidates.'
      )
      if (isAutoBank) setSelected([])
      await load()
      await loadPreview()
    }
  }

  const deleteAssessment = async () => {
    if (
      !window.confirm(
        'Remove this technical assessment configuration? Past candidate attempts stay on their hiring files. You can create a new assessment afterwards.'
      )
    ) {
      return
    }
    setError('')
    setMessage('')
    setBusy(true)
    const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Could not delete assessment')
    else {
      setMessage(data.message || 'Assessment removed.')
      setPreview(null)
      await load()
    }
  }

  const loadPreview = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening/preview`,
      { credentials: 'same-origin' }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Preview failed')
    else setPreview(data.preview)
  }

  return (
    <EmployerShell>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Technical assessment</h1>
        <p className="text-sm text-slate-600">
          {jobTitle ? (
            <>
              Role: <span className="font-medium text-slate-800">{jobTitle}</span>
            </>
          ) : (
            'Configure and publish the assessment for this role.'
          )}
        </p>
      </div>

      <StatusBanner tone={isPublished ? 'success' : 'info'}>
        {isPublished
          ? 'Published — invited candidates can open this assessment.'
          : 'Draft — candidates cannot start until you publish.'}{' '}
        {isAutoBank
          ? `Auto-select from bank · ${mixPreview.label}.`
          : `Selected questions: ${selected.length}.`}
      </StatusBanner>

      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-1">
          <li>
            Add questions in the{' '}
            <Link href="/employer/screening" className="text-[var(--brand-navy)] hover:underline">
              question bank
            </Link>
            .
          </li>
          <li>
            Choose <strong>Auto from bank</strong> and set type mix percentages, or attach questions
            manually.
          </li>
          <li>
            Edit duration, mix, and selection here anytime — then <strong>Save draft</strong> or{' '}
            <strong>Publish assessment</strong> again. Use <strong>Delete assessment</strong> to
            start over.
          </li>
          <li>
            On each application, set status to <strong>Screening</strong> to invite the candidate.
          </li>
        </ol>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
          />
          Assessment enabled for this job
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              value={config.durationMinutes}
              onChange={(e) => setConfig((c) => ({ ...c, durationMinutes: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Number of questions</Label>
            <Input
              value={config.questionCount}
              onChange={(e) => setConfig((c) => ({ ...c, questionCount: e.target.value }))}
            />
          </div>
          <p className="text-sm text-slate-600 sm:col-span-2">
            For each question:{' '}
            <span className="font-medium text-slate-800">
              {formatPerQuestionTime(
                secondsPerQuestionFromDuration(
                  Number(config.durationMinutes),
                  Number(config.questionCount)
                )
              ) ?? 'set duration and question count'}
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              This is duration divided by the number of questions. Candidates see the same split on
              the briefing screen.
            </span>
          </p>
          <div className="space-y-2">
            <Label>Categories / sections filter</Label>
            <Input
              value={config.categories}
              onChange={(e) => setConfig((c) => ({ ...c, categories: e.target.value }))}
              placeholder="Electrical, Embedded"
            />
          </div>
          <div className="space-y-2">
            <Label>Overall passing score (%)</Label>
            <Input
              value={config.passingScore}
              onChange={(e) => setConfig((c) => ({ ...c, passingScore: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Section minimums</Label>
            <Input
              value={config.sectionMinimums}
              onChange={(e) => setConfig((c) => ({ ...c, sectionMinimums: e.target.value }))}
              placeholder="Electrical:60, Embedded:60"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="candidate-instructions">Pre-instructions for candidates</Label>
            <Textarea
              id="candidate-instructions"
              value={config.candidateInstructions}
              onChange={(e) => setConfig((c) => ({ ...c, candidateInstructions: e.target.value }))}
              className="rounded-xl min-h-28"
              placeholder="Shown before they start. e.g. Have a calculator ready. Answer in SI units. Do not use AI tools."
            />
            <p className="text-xs text-slate-500">
              Optional. Candidates must acknowledge these instructions before the timer starts.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Attempt policy</Label>
            <select
              value={config.attemptPolicy}
              onChange={(e) => setConfig((c) => ({ ...c, attemptPolicy: e.target.value }))}
              className="w-full h-10 rounded-xl border px-3 text-sm"
            >
              <option value="single">Single attempt</option>
              <option value="retry_once">Retry once</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Question selection</Label>
            <select
              value={config.questionSelection}
              onChange={(e) => {
                const questionSelection = e.target.value
                setConfig((c) => ({ ...c, questionSelection }))
                setPreview(null)
                if (questionSelection === 'random_from_bank') setSelected([])
              }}
              className="w-full h-10 rounded-xl border px-3 text-sm"
            >
              <option value="manual">Manual (use selected list)</option>
              <option value="random_from_bank">Auto from bank (by type mix)</option>
              <option value="mixed">Mixed (selected + fill by mix)</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Question type mix</p>
            <p className="text-xs text-slate-500 mt-1">
              One mix for the whole assessment. Auto-select pulls <strong>multiple</strong> (MCQ /
              multi-select), <strong>short</strong> (numeric / exact short text), and{' '}
              <strong>open</strong> (guided open-ended) from the bank to match these percentages.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Multiple %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.mixMultiple}
                onChange={(e) => setConfig((c) => ({ ...c, mixMultiple: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Short answer %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.mixShort}
                onChange={(e) => setConfig((c) => ({ ...c, mixShort: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Open question %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.mixOpen}
                onChange={(e) => setConfig((c) => ({ ...c, mixOpen: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-slate-600">
            For {config.questionCount || '0'} questions → {mixPreview.label}
            {Number(config.mixMultiple) + Number(config.mixShort) + Number(config.mixOpen) !== 100
              ? ' (percentages are normalized to 100% when saved).'
              : '.'}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.randomized}
            onChange={(e) => setConfig((c) => ({ ...c, randomized: e.target.checked }))}
          />
          Randomize question and option order
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.dynamicParameters}
            onChange={(e) => setConfig((c) => ({ ...c, dynamicParameters: e.target.checked }))}
          />
          Resolve dynamic technical parameters per candidate
        </label>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium">
              {isAutoBank
                ? 'Question bank (auto-select uses the full bank)'
                : `Attach questions (${selected.length} selected)`}
            </p>
            <Link href="/employer/screening" className="text-sm text-[var(--brand-navy)] hover:underline">
              Manage question bank
            </Link>
          </div>
          {isAutoBank ? (
            <StatusBanner tone="info">
              Each candidate gets {config.questionCount || '—'} questions drawn from the bank (
              {questions.length} available) using your type mix. Checkboxes below are for Mixed /
              Manual modes.
            </StatusBanner>
          ) : null}
          {questions.length === 0 ? (
            <StatusBanner tone="info">
              No questions yet. Create them in the question bank, then return here to select and
              publish.
            </StatusBanner>
          ) : (
            <div className="space-y-2 max-h-72 overflow-auto rounded-xl border border-slate-200 p-3">
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(q.id)}
                    disabled={isAutoBank}
                    onChange={(e) => {
                      setSelected((ids) =>
                        e.target.checked ? [...ids, q.id] : ids.filter((id) => id !== q.id)
                      )
                    }}
                  />
                  <span>
                    <span className="text-slate-800">{q.prompt.slice(0, 120)}</span>
                    {q.prompt.length > 120 ? '…' : ''}
                    <span className="block text-xs text-slate-500">
                      {q.question_type ?? 'question'}
                      {q.section ? ` · ${q.section}` : ''}
                      {q.owner_type === 'platform' ? ' · platform' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !canWriteScreening}
            onClick={() => void save('draft')}
          >
            Save draft
          </Button>
          <Button
            type="button"
            className="bg-[var(--brand-navy)] text-white"
            disabled={busy || !canWriteScreening}
            onClick={() => void save('publish')}
          >
            Publish assessment
          </Button>
          {isPublished ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy || !canWriteScreening}
              onClick={() => void save('unpublish')}
            >
              Unpublish
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="text-red-700 border-red-200"
            disabled={busy || !canWriteScreening}
            onClick={() => void deleteAssessment()}
          >
            Delete assessment
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void loadPreview()}>
            Preview config
          </Button>
          <p className="text-xs text-slate-500 w-full">
            Preview uses the last saved settings. Save draft or publish after changing Auto from bank,
            then preview.
          </p>
        </div>

        {preview ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm space-y-2">
            <p className="text-sm font-medium">
              Preview ({preview.items?.length ?? 0}{' '}
              {preview.questionSelection === 'random_from_bank' ? 'sample' : 'attached'})
            </p>
            {preview.sampleNote ? (
              <p className="text-xs text-slate-500">{preview.sampleNote}</p>
            ) : null}
            {(preview.items ?? []).slice(0, 12).map((item, idx) => (
              <p key={idx} className="text-slate-700">
                {idx + 1}. {item.prompt}
                {item.questionType ? (
                  <span className="text-xs text-slate-500"> · {item.questionType}</span>
                ) : null}
              </p>
            ))}
            {(preview.items ?? []).length === 0 ? (
              <p className="text-slate-600">No questions available for this selection yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </EmployerShell>
  )
}
