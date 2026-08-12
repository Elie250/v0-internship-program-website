'use client'

import { useEffect, useState } from 'react'
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
    durationMinutes: '60',
    questionCount: '10',
    categories: '',
    passingScore: '70',
    passingCriteria: '',
    attemptPolicy: 'single',
    questionSelection: 'manual',
    randomized: true,
    dynamicParameters: false,
    perQuestionTimeSeconds: '90',
    integrityMonitoring: false,
  })
  const [questions, setQuestions] = useState<Array<{ id: string; prompt: string; owner_type: string; discipline?: string }>>([])
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orgId) return
    void (async () => {
      const [cfgRes, qRes] = await Promise.all([
        fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
          credentials: 'same-origin',
        }),
        fetch(`/api/recruitment/organizations/${orgId}/questions`, { credentials: 'same-origin' }),
      ])
      const cfg = await cfgRes.json()
      const qs = await qRes.json()
      if (cfg.config) {
        setConfig((current) => ({
          ...current,
          enabled: Boolean(cfg.config.enabled),
          durationMinutes: String(cfg.config.duration_minutes ?? '60'),
          questionCount: String(cfg.config.question_count ?? '10'),
          categories: Array.isArray(cfg.config.categories) ? cfg.config.categories.join(', ') : '',
          passingScore: String(cfg.config.passing_score ?? '70'),
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
    })()
  }, [orgId, params.jobId])

  const save = async () => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/screening`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        enabled: config.enabled,
        durationMinutes: Number(config.durationMinutes),
        questionCount: Number(config.questionCount),
        categories: config.categories.split(',').map((s) => s.trim()).filter(Boolean),
        passingScore: Number(config.passingScore),
        passingCriteria: config.passingCriteria,
        attemptPolicy: config.attemptPolicy,
        questionSelection: config.questionSelection,
        randomized: config.randomized,
        dynamicParameters: config.dynamicParameters,
        perQuestionTimeSeconds: Number(config.perQuestionTimeSeconds),
        integrityMonitoring: config.integrityMonitoring,
        questionIds: selected,
      }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Save failed')
    else setMessage('Screening configuration saved. Candidate execution is not enabled in this phase.')
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Screening configuration</h1>
      <p className="text-sm text-slate-600">
        Configure requirements now. The candidate screening engine is deferred to a later phase.
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
            <Input value={config.durationMinutes} onChange={(e) => setConfig((c) => ({ ...c, durationMinutes: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Number of questions</Label>
            <Input value={config.questionCount} onChange={(e) => setConfig((c) => ({ ...c, questionCount: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Categories</Label>
            <Input value={config.categories} onChange={(e) => setConfig((c) => ({ ...c, categories: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Passing score</Label>
            <Input value={config.passingScore} onChange={(e) => setConfig((c) => ({ ...c, passingScore: e.target.value }))} />
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
          <input type="checkbox" checked={config.randomized} onChange={(e) => setConfig((c) => ({ ...c, randomized: e.target.checked }))} />
          Randomized questions
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.dynamicParameters} onChange={(e) => setConfig((c) => ({ ...c, dynamicParameters: e.target.checked }))} />
          Dynamic parameters (stored only — not executed yet)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.integrityMonitoring} onChange={(e) => setConfig((c) => ({ ...c, integrityMonitoring: e.target.checked }))} />
          Integrity monitoring (stored only — not executed yet)
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
                  <span className="text-xs uppercase text-slate-500">{q.owner_type}</span> {q.prompt}
                </span>
              </label>
            ))}
          </div>
        </div>
        {canWriteScreening ? (
          <Button onClick={() => void save()} className="bg-[var(--brand-navy)] text-white">
            Save configuration
          </Button>
        ) : (
          <p className="text-sm text-slate-600">Hiring managers can view screening setup but cannot change it.</p>
        )}
      </div>
    </EmployerShell>
  )
}
