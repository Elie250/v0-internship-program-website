'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/recruitment/talent-ui'

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
  })
  const [questions, setQuestions] = useState<
    Array<{ id: string; prompt: string; owner_type: string; question_type?: string; section?: string }>
  >([])
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<{ items?: Array<{ prompt?: string }> } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const isPublished = config.status === 'published'

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
      }))
    }
    setSelected((cfg.items ?? []).map((item: { question_id: string }) => item.question_id))
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
    if (mode === 'publish' && selected.length === 0) {
      setError(
        'Select at least one question below before publishing. Add questions in the question bank first if the list is empty.'
      )
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
        attemptPolicy: config.attemptPolicy,
        questionSelection: config.questionSelection,
        randomized: config.randomized,
        dynamicParameters: config.dynamicParameters,
        perQuestionTimeSeconds: Number(config.perQuestionTimeSeconds),
        integrityMonitoring: config.integrityMonitoring,
        questionIds: selected,
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
        Selected questions: {selected.length}.
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
          <li>Select which questions belong to this role (below).</li>
          <li>Click <strong>Publish assessment</strong>.</li>
          <li>On each application, set status to <strong>Screening</strong> to invite the candidate.</li>
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
              onChange={(e) => setConfig((c) => ({ ...c, questionSelection: e.target.value }))}
              className="w-full h-10 rounded-xl border px-3 text-sm"
            >
              <option value="manual">Manual (use selected list)</option>
              <option value="random_from_bank">Random from bank</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
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
            <p className="text-sm font-medium">Attach questions ({selected.length} selected)</p>
            <Link href="/employer/screening" className="text-sm text-[var(--brand-navy)] hover:underline">
              Manage question bank
            </Link>
          </div>
          {questions.length === 0 ? (
            <StatusBanner tone="info">
              No questions yet. Create them in the question bank, then return here to select and
              publish.
            </StatusBanner>
          ) : (
            <div className="space-y-2 max-h-72 overflow-auto rounded-xl border border-slate-200 p-3">
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(q.id)}
                    onChange={(e) => {
                      setSelected((current) =>
                        e.target.checked ? [...current, q.id] : current.filter((id) => id !== q.id)
                      )
                    }}
                  />
                  <span>
                    <span className="text-xs uppercase text-slate-500">
                      {q.owner_type === 'platform' ? 'Platform' : 'Company'}
                      {q.question_type ? ` · ${q.question_type.replace(/_/g, ' ')}` : ''}
                    </span>
                    <span className="block mt-0.5">{q.prompt}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {canWriteScreening ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              disabled={busy}
              onClick={() => void save('draft')}
              variant="outline"
            >
              Save draft
            </Button>
            <Button
              disabled={busy || selected.length === 0}
              onClick={() => void save('publish')}
              className="bg-[var(--brand-navy)] text-white"
            >
              {busy ? 'Saving…' : isPublished ? 'Update & keep published' : 'Publish assessment'}
            </Button>
            {isPublished ? (
              <Button disabled={busy} onClick={() => void save('unpublish')} variant="outline">
                Unpublish
              </Button>
            ) : null}
            <Button disabled={busy} onClick={() => void loadPreview()} variant="outline">
              Preview
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Hiring managers can view assessment setup but cannot change it.
          </p>
        )}

        {preview ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-sm font-medium">Preview ({preview.items?.length ?? 0} attached)</p>
            {(preview.items ?? []).slice(0, 8).map((item, idx) => (
              <p key={idx} className="text-sm text-slate-700 line-clamp-2">
                {idx + 1}. {item.prompt}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </EmployerShell>
  )
}
