'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CheckCircle2, Edit2, Plus, Trash2, X } from 'lucide-react'

type QuizQuestion = {
  id?: string
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
  /** STEM placeholders e.g. [{ key: 'V', min: 10, max: 24, type: 'integer', unit: 'V' }] */
  parameters?: unknown[]
  /** Optional { expression, distractorExpressions } for numeric MCQ variants */
  answer_spec?: { expression?: string; distractorExpressions?: string[]; decimals?: number }
}

type Quiz = {
  id: string
  title: string
  description: string | null
  passing_score: number
  is_published: boolean
  questions: QuizQuestion[]
  max_attempts?: number
  time_limit_minutes?: number | null
  shuffle_questions?: boolean
  shuffle_options?: boolean
  require_lessons_complete?: boolean
  lock_after_pass?: boolean
  require_fullscreen?: boolean
  cooldown_minutes?: number
  reveal_answers?: string
  integrity_thresholds?: Record<string, number> | null
}

const emptyQuestion = (): QuizQuestion => ({
  question: '',
  options: ['', ''],
  correct_index: 0,
  explanation: null,
  parameters: [],
  answer_spec: {},
})

export function LecturerQuizBuilder({ courseId }: { courseId: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState('70')
  const [maxAttempts, setMaxAttempts] = useState('3')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('45')
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [requireLessonsComplete, setRequireLessonsComplete] = useState(true)
  const [lockAfterPass, setLockAfterPass] = useState(true)
  const [requireFullscreen, setRequireFullscreen] = useState(false)
  const [cooldownMinutes, setCooldownMinutes] = useState('60')
  const [revealAnswers, setRevealAnswers] = useState('after_all_attempts')
  const [visibilityReview, setVisibilityReview] = useState('')
  const [clipboardReview, setClipboardReview] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lecturer/courses/${courseId}/quizzes`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load quizzes')
      setQuizzes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditingQuizId(null)
    setTitle('')
    setDescription('')
    setPassingScore('70')
    setMaxAttempts('3')
    setTimeLimitMinutes('45')
    setShuffleQuestions(true)
    setShuffleOptions(true)
    setRequireLessonsComplete(true)
    setLockAfterPass(true)
    setRequireFullscreen(false)
    setCooldownMinutes('60')
    setRevealAnswers('after_all_attempts')
    setVisibilityReview('')
    setClipboardReview('')
    setQuestions([emptyQuestion()])
    setEditorOpen(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (quiz: Quiz) => {
    setEditingQuizId(quiz.id)
    setTitle(quiz.title)
    setDescription(quiz.description ?? '')
    setPassingScore(String(quiz.passing_score))
    setMaxAttempts(String(quiz.max_attempts ?? 3))
    setTimeLimitMinutes(String(quiz.time_limit_minutes ?? 45))
    setShuffleQuestions(quiz.shuffle_questions !== false)
    setShuffleOptions(quiz.shuffle_options !== false)
    setRequireLessonsComplete(quiz.require_lessons_complete !== false)
    setLockAfterPass(quiz.lock_after_pass !== false)
    setRequireFullscreen(quiz.require_fullscreen === true)
    setCooldownMinutes(String(quiz.cooldown_minutes ?? 60))
    setRevealAnswers(quiz.reveal_answers ?? 'after_all_attempts')
    setVisibilityReview(
      quiz.integrity_thresholds?.visibilityReview != null
        ? String(quiz.integrity_thresholds.visibilityReview)
        : ''
    )
    setClipboardReview(
      quiz.integrity_thresholds?.clipboardReview != null
        ? String(quiz.integrity_thresholds.clipboardReview)
        : ''
    )
    setQuestions(
      quiz.questions.length
        ? quiz.questions.map((q) => ({
            question: q.question,
            options: [...q.options],
            correct_index: q.correct_index,
            explanation: q.explanation,
            parameters: Array.isArray(q.parameters) ? q.parameters : [],
            answer_spec:
              q.answer_spec && typeof q.answer_spec === 'object' ? q.answer_spec : {},
          }))
        : [emptyQuestion()]
    )
    setEditorOpen(true)
    setError('')
    setSuccess('')
  }

  const saveQuiz = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        passing_score: Number(passingScore) || 70,
        max_attempts: Number(maxAttempts) || 3,
        time_limit_minutes: Number(timeLimitMinutes) || 45,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        require_lessons_complete: requireLessonsComplete,
        lock_after_pass: lockAfterPass,
        require_fullscreen: requireFullscreen,
        cooldown_minutes: Number(cooldownMinutes) || 0,
        reveal_answers: revealAnswers,
        integrity_thresholds: {
          ...(visibilityReview ? { visibilityReview: Number(visibilityReview) } : {}),
          ...(clipboardReview ? { clipboardReview: Number(clipboardReview) } : {}),
        },
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
          parameters: q.parameters ?? [],
          answer_spec: q.answer_spec ?? {},
        })),
      }

      const res = await fetch(`/api/lecturer/courses/${courseId}/quizzes`, {
        method: editingQuizId ? 'PATCH' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuizId ? { ...payload, quizId: editingQuizId } : payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      setEditorOpen(false)
      setSuccess(editingQuizId ? 'Assessment updated' : 'Assessment published to students')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this assessment and all student submissions for it?')) return
    setError('')
    const res = await fetch(`/api/lecturer/courses/${courseId}/quizzes`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, delete: true }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Delete failed')
      return
    }
    await load()
  }

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) }
          : q
      )
    )
  }

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q))
    )
  }

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q
        const options = q.options.filter((_, oi) => oi !== optIndex)
        let correct = q.correct_index
        if (correct === optIndex) correct = 0
        else if (correct > optIndex) correct -= 1
        return { ...q, options, correct_index: correct }
      })
    )
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base text-slate-900">Multiple-choice assessments</CardTitle>
          {!editorOpen ? (
            <Button
              size="sm"
              className="bg-[var(--brand-navy)] text-white"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 mr-1" />
              New assessment
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-slate-600">
          Students take these after studying the lessons. Answers are auto-graded and correct
          answers are revealed after each submission.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p> : null}
        {success ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{success}</p> : null}

        {editorOpen ? (
          <div className="space-y-4 rounded-lg border border-slate-300 p-4 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-900">
                {editingQuizId ? 'Edit assessment' : 'Create assessment'}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditorOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-[1fr_140px] gap-3">
              <div>
                <Label>Assessment title</Label>
                <Input
                  className="mt-1 bg-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Module 1 quiz — Electrical fundamentals"
                />
              </div>
              <div>
                <Label>Pass mark (%)</Label>
                <Input
                  className="mt-1 bg-white"
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Instructions (optional)</Label>
              <Textarea
                className="mt-1 bg-white"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown to students before they start"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div>
                <Label className="text-xs">Max attempts</Label>
                <Input className="mt-1" type="number" min={1} max={10} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Time limit (min)</Label>
                <Input className="mt-1" type="number" min={5} max={180} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Cooldown between attempts (min)</Label>
                <Input className="mt-1" type="number" min={0} max={10080} value={cooldownMinutes} onChange={(e) => setCooldownMinutes(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Reveal answers</Label>
                <select
                  className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
                  value={revealAnswers}
                  onChange={(e) => setRevealAnswers(e.target.value)}
                >
                  <option value="never">Never</option>
                  <option value="after_pass">After pass</option>
                  <option value="after_all_attempts">After all attempts</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-5">
                <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-5">
                <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
                Shuffle answer choices
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-5">
                <input type="checkbox" checked={requireLessonsComplete} onChange={(e) => setRequireLessonsComplete(e.target.checked)} />
                Require lessons complete
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-5">
                <input type="checkbox" checked={lockAfterPass} onChange={(e) => setLockAfterPass(e.target.checked)} />
                Lock after pass
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-5">
                <input type="checkbox" checked={requireFullscreen} onChange={(e) => setRequireFullscreen(e.target.checked)} />
                Request fullscreen
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Shuffle questions/choices give each attempt a unique order (anti-sharing). Integrity
              bands are advisory and never auto-void scores.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
              <div>
                <Label className="text-xs">Integrity: visibility review threshold (optional)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  placeholder="default 4"
                  value={visibilityReview}
                  onChange={(e) => setVisibilityReview(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Integrity: clipboard review threshold (optional)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  placeholder="default 2"
                  value={clipboardReview}
                  onChange={(e) => setClipboardReview(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              Example STEM question text: <code>Power when V={'{V}'} V and I={'{I}'} A?</code>
            </p>
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Label className="pt-2">Question {qIndex + 1}</Label>
                    {questions.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, i) => i !== qIndex))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    ) : null}
                  </div>
                  <Textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                    placeholder="Type the question (optional placeholders like {V})"
                  />

                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Choices — select the radio button next to the <strong>correct answer</strong>.
                    </p>
                    {q.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          className="accent-green-600 shrink-0"
                          checked={q.correct_index === optIndex}
                          onChange={() => updateQuestion(qIndex, { correct_index: optIndex })}
                          title="Mark as correct answer"
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Choice ${optIndex + 1}`}
                          className={cn(
                            q.correct_index === optIndex && 'border-green-400 bg-green-50/50'
                          )}
                        />
                        {q.options.length > 2 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIndex, optIndex)}
                          >
                            <X className="h-4 w-4 text-slate-500" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-slate-800"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add choice
                    </Button>
                  </div>

                  <div className="rounded-md border border-dashed border-slate-300 p-3 space-y-2 bg-slate-50/80">
                    <p className="text-xs font-medium text-slate-700">STEM variants (optional)</p>
                    <p className="text-[11px] text-slate-500">
                      Use placeholders like {'{V}'} in the question/choices, or set an expression with
                      distractors so each attempt gets unique numbers.
                    </p>
                    <div>
                      <Label className="text-xs">Parameters JSON</Label>
                      <Textarea
                        className="mt-1 font-mono text-xs"
                        rows={2}
                        value={JSON.stringify(q.parameters ?? [], null, 0)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value || '[]')
                            if (Array.isArray(parsed)) updateQuestion(qIndex, { parameters: parsed })
                          } catch {
                            /* keep typing */
                          }
                        }}
                        placeholder='[{"key":"V","min":10,"max":24,"type":"integer","unit":"V"},{"key":"I","min":1,"max":5,"type":"integer","unit":"A"}]'
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Correct expression</Label>
                        <Input
                          className="mt-1 font-mono text-xs"
                          value={q.answer_spec?.expression ?? ''}
                          onChange={(e) =>
                            updateQuestion(qIndex, {
                              answer_spec: {
                                ...(q.answer_spec ?? {}),
                                expression: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="V * I"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Distractor expressions (comma-separated)</Label>
                        <Input
                          className="mt-1 font-mono text-xs"
                          value={(q.answer_spec?.distractorExpressions ?? []).join(', ')}
                          onChange={(e) =>
                            updateQuestion(qIndex, {
                              answer_spec: {
                                ...(q.answer_spec ?? {}),
                                distractorExpressions: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              },
                            })
                          }
                          placeholder="V + I, V - I, V / I"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Explanation shown after submission (optional)</Label>
                    <Input
                      className="mt-1"
                      value={q.explanation ?? ''}
                      onChange={(e) =>
                        updateQuestion(qIndex, { explanation: e.target.value || null })
                      }
                      placeholder="Why this answer is correct"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-slate-800"
                onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add question
              </Button>
              <Button
                type="button"
                className="bg-[var(--brand-navy)] text-white"
                disabled={saving}
                onClick={saveQuiz}
              >
                {saving ? 'Saving…' : editingQuizId ? 'Save changes' : 'Publish assessment'}
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : quizzes.length === 0 && !editorOpen ? (
          <p className="text-sm text-slate-600">
            No assessments yet. Create multiple-choice quizzes so students can be graded and earn
            their certificate.
          </p>
        ) : (
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="rounded-lg border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    {quiz.title}
                    {quiz.questions.length > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900">No questions</Badge>
                    )}
                  </p>
                  <p className="text-xs text-slate-600">
                    {quiz.questions.length} questions · pass mark {quiz.passing_score}%
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-700"
                    onClick={() => openEdit(quiz)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuiz(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
