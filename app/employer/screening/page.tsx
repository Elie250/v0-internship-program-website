'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'

type ChoiceRow = { id: string; label: string }
type ParamRow = { key: string; min: string; max: string; unit: string }

function newChoiceId() {
  return `opt_${Math.random().toString(36).slice(2, 8)}`
}

const EMPTY_CHOICES: ChoiceRow[] = [
  { id: newChoiceId(), label: '' },
  { id: newChoiceId(), label: '' },
]

export default function EmployerScreeningPage() {
  const { orgId, canWriteScreening } = useEmployerOrg()
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([])
  const [questions, setQuestions] = useState<
    Array<{
      id: string
      prompt: string
      owner_type: string
      discipline?: string | null
      difficulty?: string | null
      question_type?: string
      section?: string | null
      options?: Array<{ id: string; label: string }>
      parameters?: Array<{ key: string; min: number; max: number; unit?: string }>
      answer_spec?: Record<string, unknown>
      answer_key?: string | null
    }>
  >([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [section, setSection] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionType, setQuestionType] = useState('multiple_choice')
  const [choices, setChoices] = useState<ChoiceRow[]>(EMPTY_CHOICES)
  const [correctOptionId, setCorrectOptionId] = useState('')
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([])
  const [parameters, setParameters] = useState<ParamRow[]>([])
  const [expression, setExpression] = useState('')
  const [tolerance, setTolerance] = useState('0.5')
  const [acceptedAnswers, setAcceptedAnswers] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const isChoiceType = questionType === 'multiple_choice' || questionType === 'multiple_select'
  const isNumeric = questionType === 'numeric'
  const isShortText = questionType === 'short_text'

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

  const resetForm = () => {
    setEditingId(null)
    setPrompt('')
    setDiscipline('')
    setSection('')
    setDifficulty('medium')
    setQuestionType('multiple_choice')
    setChoices([
      { id: newChoiceId(), label: '' },
      { id: newChoiceId(), label: '' },
    ])
    setCorrectOptionId('')
    setCorrectOptionIds([])
    setParameters([])
    setExpression('')
    setTolerance('0.5')
    setAcceptedAnswers('')
  }

  const beginEdit = (q: (typeof questions)[number]) => {
    if (q.owner_type !== 'organization') return
    setError('')
    setMessage('')
    setEditingId(q.id)
    setPrompt(q.prompt ?? '')
    setDiscipline(q.discipline ?? '')
    setSection(q.section ?? '')
    setDifficulty(q.difficulty || 'medium')
    const type = q.question_type || 'multiple_choice'
    setQuestionType(type)

    const opts = Array.isArray(q.options)
      ? q.options.map((o) => ({ id: String(o.id), label: String(o.label ?? '') }))
      : []
    setChoices(opts.length >= 2 ? opts : EMPTY_CHOICES.map((c) => ({ ...c, id: newChoiceId() })))

    const spec = (q.answer_spec ?? {}) as Record<string, unknown>
    if (type === 'multiple_choice') {
      setCorrectOptionId(String(spec.correctOptionId ?? q.answer_key ?? ''))
      setCorrectOptionIds([])
    } else if (type === 'multiple_select') {
      setCorrectOptionIds(
        Array.isArray(spec.correctOptionIds) ? spec.correctOptionIds.map(String) : []
      )
      setCorrectOptionId('')
    } else if (type === 'numeric') {
      setExpression(String(spec.expression ?? ''))
      setTolerance(String(spec.tolerance ?? '0.5'))
      setParameters(
        Array.isArray(q.parameters)
          ? q.parameters.map((p) => ({
              key: String(p.key ?? ''),
              min: String(p.min ?? ''),
              max: String(p.max ?? ''),
              unit: String(p.unit ?? ''),
            }))
          : []
      )
    } else if (type === 'short_text') {
      const answers = Array.isArray(spec.acceptedAnswers)
        ? spec.acceptedAnswers.map(String)
        : q.answer_key
          ? [String(q.answer_key)]
          : []
      setAcceptedAnswers(answers.join('\n'))
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buildPayload = ():
    | { error: string }
    | {
        prompt: string
        discipline: string
        section: string
        difficulty: string
        questionType: string
        options: Array<{ id: string; label: string }>
        parameters: Array<{ key: string; min: number; max: number; unit?: string }>
        answerSpec: Record<string, unknown>
        answerKey: string | null
      } => {
    if (!prompt.trim()) return { error: 'Enter the question text.' }

    let options: Array<{ id: string; label: string }> = []
    let parametersPayload: Array<{ key: string; min: number; max: number; unit?: string }> = []
    let answerSpec: Record<string, unknown> = {}
    let answerKey: string | null = null

    if (isChoiceType) {
      options = choices
        .map((c) => ({ id: c.id, label: c.label.trim() }))
        .filter((c) => c.label.length > 0)
      if (options.length < 2) return { error: 'Add at least two answer choices.' }
      if (questionType === 'multiple_choice') {
        if (!correctOptionId || !options.some((o) => o.id === correctOptionId)) {
          return { error: 'Select the correct answer.' }
        }
        answerSpec = { correctOptionId }
        answerKey = correctOptionId
      } else {
        const selected = correctOptionIds.filter((id) => options.some((o) => o.id === id))
        if (selected.length === 0) return { error: 'Select at least one correct answer.' }
        answerSpec = { correctOptionIds: selected }
      }
    }

    if (isNumeric) {
      parametersPayload = parameters
        .map((p) => ({
          key: p.key.trim(),
          min: Number(p.min),
          max: Number(p.max),
          unit: p.unit.trim() || undefined,
        }))
        .filter((p) => p.key)
      if (!expression.trim()) return { error: 'Enter the numeric formula (for example: V * I).' }
      const tol = Number(tolerance)
      answerSpec = {
        expression: expression.trim(),
        tolerance: Number.isFinite(tol) ? tol : 0.5,
      }
    }

    if (isShortText) {
      const answers = acceptedAnswers
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (answers.length === 0) return { error: 'Add at least one accepted text answer.' }
      answerSpec = { acceptedAnswers: answers }
      answerKey = answers[0] ?? null
    }

    return {
      prompt,
      discipline,
      section: section || discipline,
      difficulty,
      questionType,
      options,
      parameters: parametersPayload,
      answerSpec,
      answerKey,
    }
  }

  const saveQuestion = async () => {
    setError('')
    setMessage('')
    const payload = buildPayload()
    if ('error' in payload) {
      setError(payload.error)
      return
    }

    setBusy(true)
    const url = editingId
      ? `/api/recruitment/organizations/${orgId}/questions/${editingId}`
      : `/api/recruitment/organizations/${orgId}/questions`
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Could not save question')
    else {
      resetForm()
      setMessage(editingId ? 'Question updated.' : 'Question saved to your company question bank.')
      await load()
    }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm('Remove this question from the bank? It will be detached from future assessments.')) {
      return
    }
    setError('')
    setMessage('')
    setBusy(true)
    const res = await fetch(`/api/recruitment/organizations/${orgId}/questions/${questionId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) setError(data.error || 'Could not delete question')
    else {
      if (editingId === questionId) resetForm()
      setMessage('Question removed from the bank.')
      await load()
    }
  }

  const updateChoice = (id: string, label: string) => {
    setChoices((rows) => rows.map((row) => (row.id === id ? { ...row, label } : row)))
  }

  const removeChoice = (id: string) => {
    setChoices((rows) => (rows.length <= 2 ? rows : rows.filter((row) => row.id !== id)))
    setCorrectOptionIds((ids) => ids.filter((x) => x !== id))
    if (correctOptionId === id) setCorrectOptionId('')
  }

  const toggleMultiCorrect = (id: string) => {
    setCorrectOptionIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Screening</h1>
      <p className="text-sm text-slate-600">
        Step 1: build your question bank here. Step 2: open a job → Technical assessment → select
        questions → <strong>Publish assessment</strong>. Inviting a candidate (application status
        Screening) only works after that publish.
      </p>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
        <h2 className="font-semibold">Publish per job</h2>
        <p className="text-sm text-slate-600">
          Creating questions does not publish them. Configure and publish for each role:
        </p>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-600">No jobs yet. Create a job first.</p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}/screening`}
              className="block text-sm text-[var(--brand-navy)] hover:underline"
            >
              Configure &amp; publish assessment · {job.title}
            </Link>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold">{editingId ? 'Edit question' : 'Question bank'}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {editingId
              ? 'Update the question, then save. Platform questions cannot be edited.'
              : 'Add questions your candidates may see. After saving, publish them on the job assessment page.'}
          </p>
        </div>

        {canWriteScreening ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-prompt">Question text</Label>
              <Textarea
                id="q-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="rounded-xl min-h-24"
                placeholder="Example: What is the power when voltage is {V} V and current is {I} A?"
              />
              <p className="text-xs text-slate-500">
                For numeric questions with variables, write placeholders like {'{V}'} or {'{I}'} in
                the text, then define those variables below.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="q-discipline">Discipline</Label>
                <Input
                  id="q-discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  placeholder="e.g. Electrical"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-section">Section</Label>
                <Input
                  id="q-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Optional group name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-difficulty">Difficulty</Label>
                <select
                  id="q-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-type">Question type</Label>
                <select
                  id="q-type"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
                >
                  <option value="multiple_choice">Multiple choice (one correct)</option>
                  <option value="multiple_select">Multiple select (several correct)</option>
                  <option value="numeric">Numeric (calculated)</option>
                  <option value="short_text">Short text</option>
                </select>
              </div>
            </div>

            {isChoiceType ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Answer choices</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {questionType === 'multiple_choice'
                      ? 'Enter each option, then mark the correct one.'
                      : 'Enter each option, then mark all correct ones.'}
                  </p>
                </div>
                {choices.map((choice, index) => (
                  <div key={choice.id} className="flex flex-wrap items-center gap-2">
                    {questionType === 'multiple_choice' ? (
                      <input
                        type="radio"
                        name="correct-option"
                        checked={correctOptionId === choice.id}
                        onChange={() => setCorrectOptionId(choice.id)}
                        aria-label={`Mark choice ${index + 1} as correct`}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={correctOptionIds.includes(choice.id)}
                        onChange={() => toggleMultiCorrect(choice.id)}
                        aria-label={`Mark choice ${index + 1} as correct`}
                      />
                    )}
                    <Input
                      value={choice.label}
                      onChange={(e) => updateChoice(choice.id, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="h-10 rounded-xl flex-1 min-w-[12rem]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeChoice(choice.id)}
                      disabled={choices.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChoices((rows) => [...rows, { id: newChoiceId(), label: '' }])}
                >
                  Add choice
                </Button>
              </div>
            ) : null}

            {isNumeric ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Numeric answer</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Candidates enter a number. The system scores it from your formula.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-expression">Formula</Label>
                  <Input
                    id="q-expression"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="e.g. V * I"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="q-tolerance">Allowed difference (±)</Label>
                  <Input
                    id="q-tolerance"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    placeholder="0.5"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">Variables (optional)</p>
                  <p className="text-xs text-slate-500">
                    Each variable gets a random value between min and max for every candidate.
                  </p>
                  {parameters.map((param, index) => (
                    <div key={index} className="grid sm:grid-cols-5 gap-2">
                      <Input
                        value={param.key}
                        onChange={(e) =>
                          setParameters((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, key: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Name (V)"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        value={param.min}
                        onChange={(e) =>
                          setParameters((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, min: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Min"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        value={param.max}
                        onChange={(e) =>
                          setParameters((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, max: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Max"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        value={param.unit}
                        onChange={(e) =>
                          setParameters((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, unit: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Unit"
                        className="h-10 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setParameters((rows) => rows.filter((_, i) => i !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setParameters((rows) => [...rows, { key: '', min: '', max: '', unit: '' }])
                    }
                  >
                    Add variable
                  </Button>
                </div>
              </div>
            ) : null}

            {isShortText ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Label htmlFor="q-accepted">Accepted answers</Label>
                <Textarea
                  id="q-accepted"
                  value={acceptedAnswers}
                  onChange={(e) => setAcceptedAnswers(e.target.value)}
                  className="rounded-xl min-h-20"
                  placeholder={'One answer per line, or comma-separated\ne.g. Ohm\nOhms'}
                />
                <p className="text-xs text-slate-500">Matching is case-insensitive.</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void saveQuestion()}
                className="bg-[var(--brand-navy)] text-white"
              >
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add question'}
              </Button>
              {editingId ? (
                <Button disabled={busy} type="button" variant="outline" onClick={() => resetForm()}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Only organization admins and HR can add questions.
          </p>
        )}

        <ul className="space-y-2 text-sm pt-2 border-t border-slate-100">
          {questions.length === 0 ? (
            <li className="text-slate-600">No questions in the bank yet.</li>
          ) : (
            questions.map((q) => (
              <li key={q.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs uppercase text-slate-500">
                      {q.owner_type === 'platform' ? 'Platform' : 'Company'}
                      {q.question_type ? ` · ${q.question_type.replace(/_/g, ' ')}` : ''}
                    </span>
                    <p className="mt-1">{q.prompt}</p>
                    {q.section || q.discipline ? (
                      <p className="text-xs text-slate-500 mt-1">{q.section || q.discipline}</p>
                    ) : null}
                  </div>
                  {canWriteScreening && q.owner_type === 'organization' ? (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => beginEdit(q)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void deleteQuestion(q.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </EmployerShell>
  )
}
