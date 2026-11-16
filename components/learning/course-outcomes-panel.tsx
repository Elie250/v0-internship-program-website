'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { OUTCOME_SCOPE_HELP, type OutcomeScope } from '@/lib/learning/curriculum-outcomes'

type OutcomeRow = {
  id: string
  scope: OutcomeScope
  code: string | null
  statement: string
  successCriteria: string | null
  moduleId: string | null
  contentId: string | null
  sortOrder: number
}

type ModuleOption = { id: string; title: string }
type LessonOption = { id: string; title: string }

export function CourseOutcomesPanel({
  courseId,
  mode,
  modules = [],
  lessons = [],
}: {
  courseId: string
  mode: 'admin' | 'lecturer'
  modules?: ModuleOption[]
  lessons?: LessonOption[]
}) {
  const base =
    mode === 'admin'
      ? `/api/admin/courses/${courseId}/outcomes`
      : `/api/lecturer/courses/${courseId}/outcomes`
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([])
  const [scope, setScope] = useState<OutcomeScope>('programme')
  const [statement, setStatement] = useState('')
  const [code, setCode] = useState('')
  const [successCriteria, setSuccessCriteria] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [contentId, setContentId] = useState('')
  const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>(modules)
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>(lessons)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const modulesBase =
    mode === 'admin'
      ? `/api/admin/courses/${courseId}/modules`
      : `/api/lecturer/courses/${courseId}/modules`
  const contentBase =
    mode === 'admin'
      ? `/api/admin/courses/${courseId}/content`
      : `/api/lecturer/courses/${courseId}/content`

  const load = useCallback(async () => {
    const [outcomesRes, modulesRes, lessonsRes] = await Promise.all([
      fetch(base),
      fetch(modulesBase),
      fetch(contentBase),
    ])
    const data = await outcomesRes.json()
    if (!outcomesRes.ok || !data.ok) {
      setError(data.error || 'Failed to load outcomes')
      return
    }
    setOutcomes(data.outcomes ?? [])
    const modulesData = await modulesRes.json().catch(() => ({}))
    if (modulesRes.ok && modulesData.ok) {
      setModuleOptions(
        (modulesData.modules ?? []).map((row: { id: string; title: string }) => ({
          id: String(row.id),
          title: String(row.title),
        }))
      )
    } else if (modules.length) {
      setModuleOptions(modules)
    }
    const lessonsData = await lessonsRes.json().catch(() => [])
    if (lessonsRes.ok && Array.isArray(lessonsData)) {
      setLessonOptions(
        lessonsData.map((row: { id: string; title: string }) => ({
          id: String(row.id),
          title: String(row.title),
        }))
      )
    } else if (lessons.length) {
      setLessonOptions(lessons)
    }
    setError('')
  }, [base, contentBase, lessons, modules, modulesBase])

  useEffect(() => {
    void load()
  }, [load])

  async function createOutcome() {
    setBusy(true)
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        scope,
        statement,
        code: code || null,
        successCriteria: successCriteria || null,
        moduleId: scope === 'module' ? moduleId || null : null,
        contentId: scope === 'lesson' ? contentId || null : null,
      }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not save outcome')
      return
    }
    setStatement('')
    setCode('')
    setSuccessCriteria('')
    await load()
  }

  async function remove(outcomeId: string) {
    setBusy(true)
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', outcomeId }),
    })
    setBusy(false)
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Delete failed')
      return
    }
    await load()
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Learning outcomes</h3>
        <p className="text-xs text-slate-600 mt-1">
          Structured measurable outcomes for curriculum design. Brochure objectives on the programme
          report remain separate and unchanged.
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-2">
        <div>
          <Label>Scope</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as OutcomeScope)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programme">Programme (PLO)</SelectItem>
              <SelectItem value="course">Course (CLO)</SelectItem>
              <SelectItem value="module">Module</SelectItem>
              <SelectItem value="lesson">Lesson</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500 mt-1">{OUTCOME_SCOPE_HELP[scope]}</p>
        </div>
        {scope === 'module' ? (
          <div>
            <Label>Module</Label>
            <Select value={moduleId || 'none'} onValueChange={(v) => setModuleId(v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select…</SelectItem>
                {moduleOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {scope === 'lesson' ? (
          <div>
            <Label>Lesson</Label>
            <Select value={contentId || 'none'} onValueChange={(v) => setContentId(v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select lesson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select…</SelectItem>
                {lessonOptions.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="grid sm:grid-cols-[120px_1fr] gap-2">
          <div>
            <Label>Code</Label>
            <Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PLO-1" />
          </div>
          <div>
            <Label>Statement</Label>
            <Textarea
              className="mt-1"
              rows={2}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Measurable outcome…"
            />
          </div>
        </div>
        <div>
          <Label>Success criteria (optional)</Label>
          <Textarea
            className="mt-1"
            rows={2}
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
          />
        </div>
        <Button type="button" disabled={busy || !statement.trim()} onClick={() => void createOutcome()}>
          Add outcome
        </Button>
      </div>
      <ul className="space-y-2">
        {outcomes.map((row) => (
          <li key={row.id} className="rounded-md border border-slate-100 p-2 text-sm">
            <div className="flex flex-wrap gap-2 items-start">
              <span className="text-xs uppercase tracking-wide text-slate-500">{row.scope}</span>
              {row.code ? <span className="text-xs font-semibold text-slate-800">{row.code}</span> : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto"
                disabled={busy}
                onClick={() => void remove(row.id)}
              >
                Delete
              </Button>
            </div>
            <p className="text-slate-900 mt-1">{row.statement}</p>
            {row.successCriteria ? (
              <p className="text-xs text-slate-600 mt-1">Criteria: {row.successCriteria}</p>
            ) : null}
          </li>
        ))}
        {!outcomes.length ? <li className="text-sm text-slate-500">No structured outcomes yet.</li> : null}
      </ul>
    </div>
  )
}
