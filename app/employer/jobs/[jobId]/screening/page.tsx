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

  const load = async () => {
    if (!orgId) return
    const [cfgRes, qRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
        credentials: 'same-origin',
      }),
      fetch(`/api/recruitment/organizations/${orgId}/questions`, { credentials: 'same-origin' }),
    ])
    const cfg = await cfgRes.json()
    const qs = await qRes.json()
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

  const save = async (publish = false) => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        enabled: config.enabled || publish,
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
        publish,
      }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Save failed')
    else {
      setMessage(publish ? 'Screening published for candidates.' : 'Screening configuration saved.')
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
      <h1 className="text-2xl font-semibold">Screening configuration</h1>
      <p className="text-sm text-slate-600">
        Enable, configure, and publish technical screening for this role. Status:{' '}
        <span className="font-medium">{config.status}</span>
      </p>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
          />
          Screening enabled for this job
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
              <option value="manual">Manual</option>
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
          <p className="text-sm font-medium mb-2">Attach questions</p>
          <div className="space-y-2 max-h-64 overflow-auto">
            {questions.map((q) => (
              <label key={q.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(q.id)}
                  onChange={(e) => {
                    setSelected((current) =>
                      e.target.checked ? [...current, q.id] : current.filter((id) => id !== q.id)
                    )
                  }}
                />
                <span>
                  <span className="text-xs uppercase text-slate-500">
                    {q.owner_type}
                    {q.question_type ? ` · ${q.question_type}` : ''}
                  </span>{' '}
                  {q.prompt}
                </span>
              </label>
            ))}
          </div>
        </div>
        {canWriteScreening ? (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void save(false)} className="bg-[var(--brand-navy)] text-white">
              Save draft
            </Button>
            <Button onClick={() => void save(true)} variant="outline">
              Publish screening
            </Button>
            <Button onClick={() => void loadPreview()} variant="outline">
              Preview
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Hiring managers can view screening setup but cannot change it.
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
        <p className="text-sm">
          <Link href="/employer/screening" className="text-[var(--brand-navy)] hover:underline">
            Manage question bank
          </Link>
        </p>
      </div>
    </EmployerShell>
  )
}
