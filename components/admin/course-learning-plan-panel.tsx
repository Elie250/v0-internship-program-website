'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ACTIVITY_KIND_LABELS, type ActivityKind } from '@/lib/learning/curriculum-workload'

type CurriculumActivity = {
  id: string
  title: string
  activityType: 'lesson' | 'assessment'
  estimatedMinutes: number | null
  activityKind: ActivityKind | null
}

type PlanItem = {
  activityType: 'lesson' | 'assessment'
  activityId: string
  sortOrder: number
  isOptional: boolean
  portionMinutes: string
  spanGroupId: string | null
}

type PlanDay = {
  dayIndex: number
  title: string
  items: PlanItem[]
}

type ServerTemplate = {
  id: string
  title: string
  status: string
  revision: number
  notes: string | null
  days: Array<{
    dayIndex: number
    title: string | null
    items: Array<{
      activityType: 'lesson' | 'assessment'
      activityId: string
      sortOrder: number
      isOptional: boolean
      portionMinutes: number | null
      spanGroupId: string | null
    }>
  }>
  totalWorkloadMinutes: number
  warnings: Array<{ code: string; message: string }>
}

function emptyDay(dayIndex: number): PlanDay {
  return { dayIndex, title: '', items: [] }
}

function minutesLabel(value: number | null | undefined) {
  if (value == null) return '—'
  return `${value} min`
}

export function CourseLearningPlanPanel({
  courseId,
  courseTitle,
}: {
  courseId: string
  courseTitle: string
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [activities, setActivities] = useState<CurriculumActivity[]>([])
  const [templates, setTemplates] = useState<ServerTemplate[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [title, setTitle] = useState('Daily learning plan')
  const [notes, setNotes] = useState('')
  const [days, setDays] = useState<PlanDay[]>([emptyDay(1)])
  const [serverWarnings, setServerWarnings] = useState<Array<{ code: string; message: string }>>([])
  const [pickActivity, setPickActivity] = useState('')

  const activityMap = useMemo(() => {
    const map = new Map<string, CurriculumActivity>()
    for (const activity of activities) {
      map.set(`${activity.activityType}:${activity.id}`, activity)
    }
    return map
  }, [activities])

  const totalMinutes = useMemo(() => {
    return days.reduce((sum, day) => {
      return (
        sum +
        day.items.reduce((daySum, item) => {
          const live = activityMap.get(`${item.activityType}:${item.activityId}`)
          const portion = item.portionMinutes.trim()
          if (portion) return daySum + (Number(portion) || 0)
          return daySum + (live?.estimatedMinutes ?? 0)
        }, 0)
      )
    }, 0)
  }, [activityMap, days])

  const applyDraft = useCallback((template: ServerTemplate) => {
    setDraftId(template.id)
    setTitle(template.title)
    setNotes(template.notes ?? '')
    setServerWarnings(template.warnings ?? [])
    setDays(
      template.days.length
        ? template.days.map((day) => ({
            dayIndex: day.dayIndex,
            title: day.title ?? '',
            items: day.items.map((item, index) => ({
              activityType: item.activityType,
              activityId: item.activityId,
              sortOrder: item.sortOrder ?? index,
              isOptional: item.isOptional,
              portionMinutes: item.portionMinutes != null ? String(item.portionMinutes) : '',
              spanGroupId: item.spanGroupId,
            })),
          }))
        : [emptyDay(1)]
    )
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/courses/${courseId}/learning-plan`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Failed to load learning plans')
      return
    }
    setActivities(data.activities ?? [])
    setTemplates(data.templates ?? [])
    setWarning(data.warning ?? null)
    const draft = (data.templates ?? []).find((row: ServerTemplate) => row.status === 'draft')
    if (draft) applyDraft(draft)
  }, [applyDraft, courseId])

  useEffect(() => {
    void load()
  }, [load])

  async function ensureDraft() {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/admin/courses/${courseId}/learning-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ensure_draft', title }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not create draft')
      return
    }
    applyDraft(data.template)
    setSuccess('Draft ready for editing.')
    await load()
  }

  async function saveDraft() {
    if (!draftId) {
      await ensureDraft()
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const payloadDays = days.map((day) => ({
      dayIndex: day.dayIndex,
      title: day.title.trim() || null,
      items: day.items.map((item, index) => ({
        activityType: item.activityType,
        activityId: item.activityId,
        sortOrder: index,
        isOptional: item.isOptional,
        portionMinutes: item.portionMinutes.trim() ? Number(item.portionMinutes) : null,
        spanGroupId: item.spanGroupId,
      })),
    }))
    const res = await fetch(`/api/admin/courses/${courseId}/learning-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_draft',
        templateId: draftId,
        title,
        notes,
        days: payloadDays,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Save failed')
      return
    }
    applyDraft(data.template)
    setSuccess('Draft saved. Students are not affected until you publish a revision.')
    await load()
  }

  async function publish() {
    if (!draftId) {
      setError('Create and save a draft first.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    // Save latest edits before publishing.
    await saveDraft()
    const res = await fetch(`/api/admin/courses/${courseId}/learning-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', templateId: draftId }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Publish failed')
      return
    }
    setSuccess(
      `Published revision ${data.template.revision}. Titles, minutes, and activity kinds are frozen for this revision. Draft remains editable.`
    )
    await load()
  }

  async function clonePublishedToDraft(templateId: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/admin/courses/${courseId}/learning-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone_to_draft', templateId }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not clone revision into a draft')
      return
    }
    applyDraft(data.template)
    setSuccess(
      'Draft replaced with a clone of the selected published revision. Published snapshots stay unchanged.'
    )
    await load()
  }

  function addDay() {
    const next = (days[days.length - 1]?.dayIndex ?? 0) + 1
    setDays([...days, emptyDay(next)])
  }

  function addActivityToDay(dayIndex: number) {
    if (!pickActivity) return
    const [activityType, activityId] = pickActivity.split(':') as ['lesson' | 'assessment', string]
    setDays((current) =>
      current.map((day) =>
        day.dayIndex === dayIndex
          ? {
              ...day,
              items: [
                ...day.items,
                {
                  activityType,
                  activityId,
                  sortOrder: day.items.length,
                  isOptional: false,
                  portionMinutes: '',
                  spanGroupId: null,
                },
              ],
            }
          : day
      )
    )
  }

  function updateItem(
    dayIndex: number,
    itemIndex: number,
    patch: Partial<PlanItem>
  ) {
    setDays((current) =>
      current.map((day) =>
        day.dayIndex !== dayIndex
          ? day
          : {
              ...day,
              items: day.items.map((item, index) =>
                index === itemIndex ? { ...item, ...patch } : item
              ),
            }
      )
    )
  }

  function removeItem(dayIndex: number, itemIndex: number) {
    setDays((current) =>
      current.map((day) =>
        day.dayIndex !== dayIndex
          ? day
          : { ...day, items: day.items.filter((_, index) => index !== itemIndex) }
      )
    )
  }

  const published = templates.filter((row) => row.status === 'published')

  return (
    <Card className="border-slate-300">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Daily learning plan</CardTitle>
        <p className="text-sm text-slate-600">
          Recommended study sequence for <strong>{courseTitle}</strong>. This is not attendance and
          does not change certificates, payments, or classroom access. Workshops stay on the separate
          sessions timetable.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
        {warning ? (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-2">
            {warning}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2">
            {success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void ensureDraft()} disabled={saving}>
            {draftId ? 'Reload draft' : 'Create draft'}
          </Button>
          <Button type="button" onClick={() => void saveDraft()} disabled={saving || !draftId}>
            Save draft
          </Button>
          <Button
            type="button"
            className="bg-[var(--brand-navy)] text-white"
            onClick={() => void publish()}
            disabled={saving || !draftId}
          >
            Publish revision
          </Button>
        </div>

        {draftId ? (
          <div className="space-y-4 border border-slate-200 rounded-lg p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Plan title</Label>
                <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Total planned minutes (draft estimate)</Label>
                <p className="mt-2 text-sm font-semibold text-slate-900">{totalMinutes} min</p>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[240px] flex-1">
                <Label>Add curriculum activity</Label>
                <Select value={pickActivity || 'none'} onValueChange={(v) => setPickActivity(v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select lesson or assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select…</SelectItem>
                    {activities.map((activity) => (
                      <SelectItem
                        key={`${activity.activityType}:${activity.id}`}
                        value={`${activity.activityType}:${activity.id}`}
                      >
                        [{activity.activityType}] {activity.title} · {minutesLabel(activity.estimatedMinutes)}
                        {activity.activityKind ? ` · ${ACTIVITY_KIND_LABELS[activity.activityKind]}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={addDay}>
                Add day
              </Button>
            </div>

            {days.map((day) => (
              <div key={day.dayIndex} className="rounded-md border border-slate-200 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-900">Day {day.dayIndex}</h4>
                  <Button type="button" size="sm" variant="outline" onClick={() => addActivityToDay(day.dayIndex)}>
                    Add selected activity
                  </Button>
                </div>
                <Input
                  placeholder="Optional day title"
                  value={day.title}
                  onChange={(e) =>
                    setDays((current) =>
                      current.map((row) =>
                        row.dayIndex === day.dayIndex ? { ...row, title: e.target.value } : row
                      )
                    )
                  }
                />
                {day.items.length === 0 ? (
                  <p className="text-sm text-slate-500">No activities on this day yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.items.map((item, itemIndex) => {
                      const live = activityMap.get(`${item.activityType}:${item.activityId}`)
                      return (
                        <li
                          key={`${item.activityId}-${itemIndex}`}
                          className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto] items-end border border-slate-100 rounded-md p-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {live?.title ?? 'Missing activity'}
                            </p>
                            <p className="text-xs text-slate-600">
                              {item.activityType} · live {minutesLabel(live?.estimatedMinutes)}
                              {live?.activityKind ? ` · ${ACTIVITY_KIND_LABELS[live.activityKind]}` : ''}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs">Portion minutes</Label>
                            <Input
                              className="mt-1"
                              value={item.portionMinutes}
                              placeholder="full"
                              onChange={(e) =>
                                updateItem(day.dayIndex, itemIndex, { portionMinutes: e.target.value })
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                            <input
                              type="checkbox"
                              checked={item.isOptional}
                              onChange={(e) =>
                                updateItem(day.dayIndex, itemIndex, { isOptional: e.target.checked })
                              }
                            />
                            Optional
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(day.dayIndex, itemIndex)}
                          >
                            Remove
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}

            {serverWarnings.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1">
                <p className="text-sm font-semibold text-amber-950">Draft warnings</p>
                {serverWarnings.map((row) => (
                  <p key={`${row.code}-${row.message}`} className="text-xs text-amber-900">
                    {row.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Create a draft to map lessons and assessments onto recommended learning days.
          </p>
        )}

        {published.length ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Published revisions</h4>
            <p className="text-xs text-slate-600">
              Published plans are immutable. To edit, clone a revision into the course draft (replaces any
              existing draft).
            </p>
            {published.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <Badge className="bg-emerald-100 text-emerald-900">rev {row.revision}</Badge>
                <span>{row.title}</span>
                <span>· {row.totalWorkloadMinutes} min snapshotted</span>
                <span>· {row.days.length} days</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void clonePublishedToDraft(row.id)}
                >
                  Edit as new draft
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
