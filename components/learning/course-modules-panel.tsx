'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ModuleRow = {
  id: string
  title: string
  summary: string | null
  sortOrder: number
  lessonCount?: number
}

export function CourseModulesPanel({
  courseId,
  mode,
}: {
  courseId: string
  mode: 'admin' | 'lecturer'
}) {
  const base =
    mode === 'admin'
      ? `/api/admin/courses/${courseId}/modules`
      : `/api/lecturer/courses/${courseId}/modules`
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(base)
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Failed to load modules')
      return
    }
    setModules(data.modules ?? [])
    setError('')
  }, [base])

  useEffect(() => {
    void load()
  }, [load])

  async function createModule() {
    setBusy(true)
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', title, summary }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not create module')
      return
    }
    setTitle('')
    setSummary('')
    await load()
  }

  async function move(moduleId: string, direction: -1 | 1) {
    const index = modules.findIndex((m) => m.id === moduleId)
    const swap = index + direction
    if (index < 0 || swap < 0 || swap >= modules.length) return
    const orderedIds = modules.map((m) => m.id)
    ;[orderedIds[index], orderedIds[swap]] = [orderedIds[swap], orderedIds[index]]
    setBusy(true)
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', orderedIds }),
    })
    setBusy(false)
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Reorder failed')
      return
    }
    await load()
  }

  async function remove(moduleId: string) {
    if (
      !window.confirm(
        'Delete this module? Lessons stay on the course and become ungrouped (module cleared only).'
      )
    ) {
      return
    }
    setBusy(true)
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', moduleId }),
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
        <h3 className="text-sm font-semibold text-slate-900">Modules</h3>
        <p className="text-xs text-slate-600 mt-1">
          Group lessons for the student outline. Deleting a module only ungroups lessons; it does not
          remove them from the course.
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <Label>Title</Label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Summary</Label>
          <Textarea className="mt-1" rows={1} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <Button type="button" disabled={busy || !title.trim()} onClick={() => void createModule()}>
          Add module
        </Button>
      </div>
      <ul className="space-y-2">
        {modules.map((mod, index) => (
          <li
            key={mod.id}
            className="flex flex-wrap items-center gap-2 rounded-md border border-slate-100 p-2 text-sm"
          >
            <span className="font-medium text-slate-900">
              {index}. {mod.title}
            </span>
            <span className="text-xs text-slate-500">{mod.lessonCount ?? 0} lessons</span>
            <div className="ml-auto flex gap-1">
              <Button type="button" size="sm" variant="outline" disabled={busy || index === 0} onClick={() => void move(mod.id, -1)}>
                Up
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || index === modules.length - 1}
                onClick={() => void move(mod.id, 1)}
              >
                Down
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void remove(mod.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
        {!modules.length ? <li className="text-sm text-slate-500">No modules yet.</li> : null}
      </ul>
    </div>
  )
}
