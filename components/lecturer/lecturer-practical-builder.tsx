'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ASSESSMENT_KIND_LABELS, PRACTICAL_KINDS, emptyPracticalBrief } from '@/lib/learning/practical-assessments'
import { Plus, Trash2 } from 'lucide-react'

type Outcome = { id: string; code: string | null; statement: string; scope: string }

type CriterionForm = {
  title: string
  description: string
  max_points: number
  levels: Array<{ label: string; description: string; points: number }>
}

type PracticalListItem = {
  id: string
  title: string
  assessment_kind: string
  kind_label: string
  is_published: boolean
  passing_score: number
  outcome_ids: string[]
}

const defaultCriterion = (): CriterionForm => ({
  title: 'Correctness of control logic',
  description: 'Program implements the required control behaviour.',
  max_points: 25,
  levels: [
    { label: 'Not met', description: 'Logic does not meet requirements.', points: 0 },
    { label: 'Partial', description: 'Some requirements met with gaps.', points: 12 },
    { label: 'Met', description: 'Requirements met with sound engineering.', points: 20 },
    { label: 'Exceeded', description: 'Robust, well-structured solution.', points: 25 },
  ],
})

export function LecturerPracticalBuilder({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<PracticalListItem[]>([])
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<(typeof PRACTICAL_KINDS)[number]>('practical_task')
  const [passingScore, setPassingScore] = useState('70')
  const [dueAt, setDueAt] = useState('')
  const [brief, setBrief] = useState(emptyPracticalBrief())
  const [requiredSoftwareText, setRequiredSoftwareText] = useState('CODESYS / TwinCAT / Factory I/O (or equivalent)')
  const [optionalSoftwareText, setOptionalSoftwareText] = useState('')
  const [alternativeSoftwareText, setAlternativeSoftwareText] = useState('')
  const [objectivesText, setObjectivesText] = useState('')
  const [criteria, setCriteria] = useState<CriterionForm[]>([defaultCriterion()])
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([])
  const [publish, setPublish] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [practicalRes, outcomeRes] = await Promise.all([
        fetch(`/api/lecturer/courses/${courseId}/practicals`, { credentials: 'same-origin' }),
        fetch(`/api/lecturer/courses/${courseId}/outcomes`, { credentials: 'same-origin' }),
      ])
      const practicalData = await practicalRes.json()
      if (!practicalRes.ok) throw new Error(practicalData.error || 'Failed to load practicals')
      setItems(practicalData.assessments ?? [])

      if (outcomeRes.ok) {
        const outcomeData = await outcomeRes.json()
        const list = Array.isArray(outcomeData?.outcomes)
          ? outcomeData.outcomes
          : Array.isArray(outcomeData)
            ? outcomeData
            : []
        setOutcomes(
          list.map((row: Outcome) => ({
            id: String(row.id),
            code: row.code ?? null,
            statement: String(row.statement ?? ''),
            scope: String(row.scope ?? 'course'),
          }))
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setKind('practical_task')
    setPassingScore('70')
    setDueAt('')
    setBrief(emptyPracticalBrief())
    setRequiredSoftwareText('CODESYS / TwinCAT / Factory I/O (or equivalent)')
    setOptionalSoftwareText('')
    setAlternativeSoftwareText('')
    setObjectivesText('')
    setCriteria([defaultCriterion()])
    setSelectedOutcomes([])
    setPublish(false)
    setWarnings([])
  }

  const openCreate = () => {
    resetEditor()
    setEditorOpen(true)
  }

  const openEdit = async (id: string) => {
    setError('')
    setSuccess('')
    const res = await fetch(`/api/lecturer/courses/${courseId}/practicals/${id}`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to load assessment')
      return
    }
    const assessment = data.assessment
    setEditingId(id)
    setTitle(assessment.title)
    setDescription(assessment.description ?? '')
    setKind(assessment.assessment_kind)
    setPassingScore(String(assessment.passing_score ?? 70))
    setDueAt(assessment.due_at ? String(assessment.due_at).slice(0, 16) : '')
    setBrief(assessment.practical_brief)
    setRequiredSoftwareText((assessment.practical_brief.required_software ?? []).join('\n'))
    setOptionalSoftwareText((assessment.practical_brief.optional_software ?? []).join('\n'))
    setAlternativeSoftwareText((assessment.practical_brief.alternative_software ?? []).join('\n'))
    setObjectivesText((assessment.practical_brief.learning_objectives ?? []).join('\n'))
    setCriteria(
      (assessment.rubric?.criteria ?? [defaultCriterion()]).map(
        (c: {
          title: string
          description: string
          max_points: number
          levels: Array<{ label: string; description: string; points: number }>
        }) => ({
          title: c.title,
          description: c.description,
          max_points: c.max_points,
          levels: c.levels,
        })
      )
    )
    setSelectedOutcomes(assessment.outcome_ids ?? [])
    setPublish(Boolean(assessment.is_published))
    setEditorOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    setWarnings([])
    try {
      const payload = {
        title,
        description,
        assessment_kind: kind,
        passing_score: Number(passingScore) || 70,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        is_published: publish,
        outcome_ids: selectedOutcomes,
        practical_brief: {
          ...brief,
          version: 1 as const,
          learning_objectives: objectivesText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          required_software: requiredSoftwareText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          optional_software: optionalSoftwareText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          alternative_software: alternativeSoftwareText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        },
        rubric: {
          title: 'Marking rubric',
          criteria: criteria.map((c, index) => ({
            title: c.title,
            description: c.description,
            max_points: Number(c.max_points),
            sort_order: index,
            levels: c.levels.map((level, levelIndex) => ({
              label: level.label,
              description: level.description,
              points: Number(level.points),
              sort_order: levelIndex,
            })),
          })),
        },
      }

      const res = await fetch(
        editingId
          ? `/api/lecturer/courses/${courseId}/practicals/${editingId}`
          : `/api/lecturer/courses/${courseId}/practicals`,
        {
          method: editingId ? 'PATCH' : 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
      setSuccess(editingId ? 'Practical assessment updated.' : 'Practical assessment created.')
      setEditorOpen(false)
      resetEditor()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Practical assessments</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Software / virtual PLC practicals. No physical hardware required for students.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate} className="bg-[var(--brand-navy)] text-white">
          <Plus className="h-4 w-4 mr-1" /> New practical
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {success ? <p className="text-sm text-green-800">{success}</p> : null}
        {warnings.map((warning) => (
          <p key={warning} className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {warning}
          </p>
        ))}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">No practical assessments yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.kind_label} · pass {item.passing_score}% · outcomes {item.outcome_ids.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_published ? 'default' : 'secondary'}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  <Button type="button" size="sm" variant="outline" onClick={() => void openEdit(item.id)}>
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editorOpen ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Kind</Label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as (typeof PRACTICAL_KINDS)[number])}
                >
                  {PRACTICAL_KINDS.map((value) => (
                    <option key={value} value={value}>
                      {ASSESSMENT_KIND_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Passing score (%)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>
              <div>
                <Label>Due date (optional)</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short description</Label>
                <Textarea
                  className="mt-1"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Brief (virtual / software delivery)</p>
              <div>
                <Label>Learning objectives (one per line)</Label>
                <Textarea className="mt-1" value={objectivesText} onChange={(e) => setObjectivesText(e.target.value)} />
              </div>
              <div>
                <Label>Required software / tools (one per line)</Label>
                <Textarea
                  className="mt-1"
                  value={requiredSoftwareText}
                  onChange={(e) => setRequiredSoftwareText(e.target.value)}
                />
              </div>
              <div>
                <Label>Optional software (one per line)</Label>
                <Textarea
                  className="mt-1"
                  value={optionalSoftwareText}
                  onChange={(e) => setOptionalSoftwareText(e.target.value)}
                />
              </div>
              <div>
                <Label>Alternative software (one per line)</Label>
                <Textarea
                  className="mt-1"
                  value={alternativeSoftwareText}
                  onChange={(e) => setAlternativeSoftwareText(e.target.value)}
                />
              </div>
              <div>
                <Label>Prerequisites</Label>
                <Textarea
                  className="mt-1"
                  value={brief.prerequisites}
                  onChange={(e) => setBrief({ ...brief, prerequisites: e.target.value })}
                />
              </div>
              <div>
                <Label>Step-by-step instructions</Label>
                <Textarea
                  className="mt-1 min-h-28"
                  value={brief.instructions}
                  onChange={(e) => setBrief({ ...brief, instructions: e.target.value })}
                />
              </div>
              <div>
                <Label>Expected results</Label>
                <Textarea
                  className="mt-1"
                  value={brief.expected_results}
                  onChange={(e) => setBrief({ ...brief, expected_results: e.target.value })}
                />
              </div>
              <div>
                <Label>Simulation / verification requirements</Label>
                <Textarea
                  className="mt-1"
                  value={brief.simulation_requirements}
                  onChange={(e) => setBrief({ ...brief, simulation_requirements: e.target.value })}
                />
              </div>
              <div>
                <Label>Submission requirements</Label>
                <Textarea
                  className="mt-1"
                  value={brief.submission_requirements}
                  onChange={(e) => setBrief({ ...brief, submission_requirements: e.target.value })}
                />
              </div>
              <div>
                <Label>Documentation requirements</Label>
                <Textarea
                  className="mt-1"
                  value={brief.documentation_requirements}
                  onChange={(e) => setBrief({ ...brief, documentation_requirements: e.target.value })}
                />
              </div>
              <div>
                <Label>Safety notes</Label>
                <Textarea
                  className="mt-1"
                  value={brief.safety_notes}
                  onChange={(e) => setBrief({ ...brief, safety_notes: e.target.value })}
                  placeholder="Ergonomics, electrical safety awareness for simulation work, etc."
                />
              </div>
              <div>
                <Label>Delivery notes</Label>
                <Textarea
                  className="mt-1"
                  value={brief.delivery_notes}
                  onChange={(e) => setBrief({ ...brief, delivery_notes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Marking rubric</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCriteria((prev) => [...prev, defaultCriterion()])}
                >
                  Add criterion
                </Button>
              </div>
              {criteria.map((criterion, index) => (
                <div key={index} className="rounded border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <Input
                      value={criterion.title}
                      onChange={(e) => {
                        const next = criteria.slice()
                        next[index] = { ...criterion, title: e.target.value }
                        setCriteria(next)
                      }}
                      placeholder="Criterion title"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={criteria.length <= 1}
                      onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={criterion.description}
                    onChange={(e) => {
                      const next = criteria.slice()
                      next[index] = { ...criterion, description: e.target.value }
                      setCriteria(next)
                    }}
                    placeholder="Criterion description"
                  />
                  <div className="max-w-[10rem]">
                    <Label>Max points</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min={1}
                      value={criterion.max_points}
                      onChange={(e) => {
                        const next = criteria.slice()
                        next[index] = { ...criterion, max_points: Number(e.target.value) || 0 }
                        setCriteria(next)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Levels</p>
                    {criterion.levels.map((level, levelIndex) => (
                      <div key={levelIndex} className="grid gap-2 sm:grid-cols-[8rem_5rem_1fr]">
                        <Input
                          value={level.label}
                          onChange={(e) => {
                            const next = criteria.slice()
                            const levels = criterion.levels.slice()
                            levels[levelIndex] = { ...level, label: e.target.value }
                            next[index] = { ...criterion, levels }
                            setCriteria(next)
                          }}
                          placeholder="Label"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={level.points}
                          onChange={(e) => {
                            const next = criteria.slice()
                            const levels = criterion.levels.slice()
                            levels[levelIndex] = { ...level, points: Number(e.target.value) || 0 }
                            next[index] = { ...criterion, levels }
                            setCriteria(next)
                          }}
                        />
                        <Input
                          value={level.description}
                          onChange={(e) => {
                            const next = criteria.slice()
                            const levels = criterion.levels.slice()
                            levels[levelIndex] = { ...level, description: e.target.value }
                            next[index] = { ...criterion, levels }
                            setCriteria(next)
                          }}
                          placeholder="Level description"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Learning outcomes (recommended)</p>
              {outcomes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No structured outcomes yet. Create them in the Outcomes panel. Publishing without
                  links will show a warning only.
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white p-2">
                  {outcomes.map((outcome) => (
                    <label key={outcome.id} className="flex items-start gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedOutcomes.includes(outcome.id)}
                        onChange={(e) => {
                          setSelectedOutcomes((prev) =>
                            e.target.checked
                              ? [...prev, outcome.id]
                              : prev.filter((id) => id !== outcome.id)
                          )
                        }}
                      />
                      <span>
                        {outcome.code ? `${outcome.code}: ` : ''}
                        {outcome.statement}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              Publish for students (requires complete brief + rubric)
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="bg-[var(--brand-navy)] text-white"
              >
                {saving ? 'Saving…' : 'Save practical'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setEditorOpen(false)
                  resetEditor()
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
