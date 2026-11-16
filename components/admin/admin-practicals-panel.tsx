'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PracticalRow = {
  id: string
  title: string
  kind_label: string
  is_published: boolean
  delivery_mode: string
  outcome_count: number
  has_rubric: boolean
  queue: { submitted: number; graded: number; returned: number }
}

export function AdminPracticalsPanel({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<PracticalRow[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/practicals`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load practicals')
      setRows(data.assessments ?? [])
      setNote(data.note ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Practical assessments oversight</CardTitle>
        {note ? <p className="text-xs text-slate-500 mt-1">{note}</p> : null}
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="text-sm text-slate-600">No practical assessments for this course.</p>
        ) : null}
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded border border-slate-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">
                    {row.kind_label} · {row.delivery_mode} · outcomes {row.outcome_count}
                    {row.has_rubric ? ' · rubric ready' : ' · missing rubric'}
                  </p>
                </div>
                <Badge variant={row.is_published ? 'default' : 'secondary'}>
                  {row.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Queue — awaiting: {row.queue.submitted}, returned: {row.queue.returned}, graded:{' '}
                {row.queue.graded}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
