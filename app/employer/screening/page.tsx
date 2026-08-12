'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'

export default function EmployerScreeningPage() {
  const { orgId, canWriteScreening } = useEmployerOrg()
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([])
  const [questions, setQuestions] = useState<
    Array<{
      id: string
      prompt: string
      owner_type: string
      discipline?: string | null
      question_type?: string
      section?: string | null
    }>
  >([])
  const [prompt, setPrompt] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [section, setSection] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionType, setQuestionType] = useState('short_text')
  const [optionsJson, setOptionsJson] = useState('[]')
  const [parametersJson, setParametersJson] = useState('[]')
  const [answerSpecJson, setAnswerSpecJson] = useState('{}')
  const [answerKey, setAnswerKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!orgId) return
    const [jobsRes, qRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/jobs`, { credentials: 'same-origin' }),
      fetch(`/api/recruitment/organizations/${orgId}/questions`, { credentials: 'same-origin' }),
    ])
    const jobsData = await jobsRes.json()
    const qData = await qRes.json()
    if (jobsRes.ok) setJobs(jobsData.jobs ?? [])
    if (qRes.ok) setQuestions(qData.questions ?? [])
  }

  useEffect(() => {
    void load()
  }, [orgId])

  const createQuestion = async () => {
    setError('')
    setMessage('')
    let options: unknown = []
    let parameters: unknown = []
    let answerSpec: unknown = {}
    try {
      options = JSON.parse(optionsJson || '[]')
      parameters = JSON.parse(parametersJson || '[]')
      answerSpec = JSON.parse(answerSpecJson || '{}')
    } catch {
      setError('Options, parameters, and answer spec must be valid JSON.')
      return
    }
    const res = await fetch(`/api/recruitment/organizations/${orgId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        prompt,
        discipline,
        section: section || discipline,
        difficulty,
        questionType,
        options,
        parameters,
        answerSpec,
        answerKey,
      }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not create question')
    else {
      setPrompt('')
      setAnswerKey('')
      setMessage('Organization-private question saved.')
      await load()
    }
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Screening</h1>
      <p className="text-sm text-slate-600">
        Configure job screening and manage organization-private questions. Platform answer keys are
        never shown here.
      </p>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
        <h2 className="font-semibold">Jobs</h2>
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/employer/jobs/${job.id}/screening`}
            className="block text-sm text-[var(--brand-navy)] hover:underline"
          >
            Configure screening · {job.title}
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">Question bank</h2>
        {canWriteScreening ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Prompt (use {'{V}'}, {'{I}'} for parameters)</Label>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              />
              <Input
                placeholder="Section (e.g. Electrical)"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-10 rounded-xl border px-3 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="h-10 rounded-xl border px-3 text-sm"
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="multiple_select">Multiple select</option>
                <option value="numeric">Numeric</option>
                <option value="short_text">Short text</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Options JSON</Label>
              <Textarea
                value={optionsJson}
                onChange={(e) => setOptionsJson(e.target.value)}
                className="rounded-xl font-mono text-xs min-h-20"
                placeholder='[{"id":"a","label":"24 W"},{"id":"b","label":"48 W"}]'
              />
            </div>
            <div className="space-y-2">
              <Label>Parameters JSON</Label>
              <Textarea
                value={parametersJson}
                onChange={(e) => setParametersJson(e.target.value)}
                className="rounded-xl font-mono text-xs min-h-20"
                placeholder='[{"key":"V","min":12,"max":48,"unit":"V"},{"key":"I","min":1,"max":5,"unit":"A"}]'
              />
            </div>
            <div className="space-y-2">
              <Label>Answer spec JSON</Label>
              <Textarea
                value={answerSpecJson}
                onChange={(e) => setAnswerSpecJson(e.target.value)}
                className="rounded-xl font-mono text-xs min-h-20"
                placeholder='{"expression":"V * I","tolerance":0.5} or {"correctOptionId":"a"}'
              />
            </div>
            <div className="space-y-2">
              <Label>Legacy answer key (optional)</Label>
              <Input value={answerKey} onChange={(e) => setAnswerKey(e.target.value)} />
            </div>
            <Button onClick={() => void createQuestion()} className="bg-[var(--brand-navy)] text-white">
              Add question
            </Button>
          </div>
        ) : null}
        <ul className="space-y-2 text-sm">
          {questions.map((q) => (
            <li key={q.id} className="rounded-xl border border-slate-200 p-3">
              <span className="text-xs uppercase text-slate-500">
                {q.owner_type}
                {q.question_type ? ` · ${q.question_type}` : ''}
              </span>
              <p>{q.prompt}</p>
              {q.section || q.discipline ? (
                <p className="text-xs text-slate-500">{q.section || q.discipline}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </EmployerShell>
  )
}
