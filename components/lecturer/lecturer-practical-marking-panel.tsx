'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SubmissionRow = {
  id: string
  assessment_id: string
  assessment_title: string
  student_name: string
  student_email: string
  practical_status: string | null
  student_notes: string | null
  feedback_summary: string | null
  score: number | null
  passed: boolean
  submitted_at: string | null
  artifacts: Array<{
    id: string
    file_name: string
    label: string
    download_path?: string
  }>
  criterion_scores: Array<{
    criterion_id: string
    points_awarded: number
    comment: string
    level_id: string | null
  }>
}

type RubricCriterion = {
  id: string
  title: string
  description: string
  max_points: number
  levels: Array<{ id: string; label: string; points: number; description: string }>
}

export function LecturerPracticalMarkingPanel({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [active, setActive] = useState<SubmissionRow | null>(null)
  const [criteria, setCriteria] = useState<RubricCriterion[]>([])
  const [scores, setScores] = useState<Record<string, { points: string; comment: string; levelId: string }>>({})
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lecturer/courses/${courseId}/practicals/submissions`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load submissions')
      setRows(data.submissions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const openMark = async (row: SubmissionRow) => {
    setActive(row)
    setFeedback(row.feedback_summary ?? '')
    setMessage('')
    const res = await fetch(`/api/lecturer/courses/${courseId}/practicals/${row.assessment_id}`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to load rubric')
      return
    }
    const rubricCriteria = data.assessment?.rubric?.criteria ?? []
    setCriteria(rubricCriteria)
    const next: Record<string, { points: string; comment: string; levelId: string }> = {}
    for (const criterion of rubricCriteria) {
      const existing = row.criterion_scores.find((s) => s.criterion_id === criterion.id)
      next[criterion.id] = {
        points: existing ? String(existing.points_awarded) : '',
        comment: existing?.comment ?? '',
        levelId: existing?.level_id ?? '',
      }
    }
    setScores(next)
  }

  const save = async (action: 'grade' | 'return') => {
    if (!active) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const criterion_scores = criteria.map((criterion) => ({
        criterion_id: criterion.id,
        points_awarded: Number(scores[criterion.id]?.points ?? 0),
        level_id: scores[criterion.id]?.levelId || null,
        comment: scores[criterion.id]?.comment ?? '',
      }))
      const res = await fetch(
        `/api/lecturer/courses/${courseId}/practicals/submissions/${active.id}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            feedback_summary: feedback,
            criterion_scores,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Marking failed')
      setMessage(action === 'return' ? 'Returned to student for corrections.' : 'Graded.')
      setActive(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Marking failed')
    } finally {
      setSaving(false)
    }
  }

  const queue = rows.filter((row) =>
    ['submitted', 'resubmitted', 'returned', 'graded'].includes(String(row.practical_status))
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Practical marking queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-green-800">{message}</p> : null}
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-slate-600">No practical submissions yet.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {row.student_name} · {row.assessment_title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.student_email} · {row.practical_status}
                    {row.score != null ? ` · ${row.score}%` : ''}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => void openMark(row)}>
                  Mark
                </Button>
              </li>
            ))}
          </ul>
        )}

        {active ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{active.student_name}</p>
                <p className="text-sm text-slate-600">{active.assessment_title}</p>
                <Badge className="mt-1">{active.practical_status}</Badge>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>

            {active.student_notes ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student notes</p>
                <p className="text-sm whitespace-pre-wrap text-slate-800">{active.student_notes}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Artifacts
              </p>
              <ul className="space-y-1">
                {active.artifacts.map((file) => (
                  <li key={file.id}>
                    <a
                      href={
                        file.download_path ||
                        `/api/lecturer/courses/${courseId}/practicals/artifacts/${file.id}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--brand-navy)] underline"
                    >
                      {file.label ? `${file.label}: ` : ''}
                      {file.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="rounded border border-slate-200 bg-white p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-900">
                    {criterion.title}{' '}
                    <span className="text-slate-500 font-normal">(max {criterion.max_points})</span>
                  </p>
                  <p className="text-xs text-slate-600">{criterion.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label>Level</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={scores[criterion.id]?.levelId ?? ''}
                        onChange={(e) => {
                          const level = criterion.levels.find((l) => l.id === e.target.value)
                          setScores((prev) => ({
                            ...prev,
                            [criterion.id]: {
                              points: level ? String(level.points) : prev[criterion.id]?.points ?? '',
                              comment: prev[criterion.id]?.comment ?? '',
                              levelId: e.target.value,
                            },
                          }))
                        }}
                      >
                        <option value="">Custom points</option>
                        {criterion.levels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.label} ({level.points})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Points awarded</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min={0}
                        max={criterion.max_points}
                        value={scores[criterion.id]?.points ?? ''}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [criterion.id]: {
                              points: e.target.value,
                              comment: prev[criterion.id]?.comment ?? '',
                              levelId: prev[criterion.id]?.levelId ?? '',
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Textarea
                    value={scores[criterion.id]?.comment ?? ''}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [criterion.id]: {
                          points: prev[criterion.id]?.points ?? '',
                          comment: e.target.value,
                          levelId: prev[criterion.id]?.levelId ?? '',
                        },
                      }))
                    }
                    placeholder="Criterion comment"
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Overall feedback</Label>
              <Textarea className="mt-1" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={saving}
                className="bg-[var(--brand-navy)] text-white"
                onClick={() => void save('grade')}
              >
                Finalize grade
              </Button>
              <Button
                type="button"
                disabled={saving}
                variant="outline"
                onClick={() => void save('return')}
              >
                Return for corrections
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
