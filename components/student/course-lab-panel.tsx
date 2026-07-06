'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Upload } from 'lucide-react'

type LabRow = {
  id: string
  title: string
  file_name: string | null
  file_url: string | null
  notes: string | null
  status: string
  lecturer_feedback: string | null
  created_at: string
}

export function CourseLabPanel({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<LabRow[]>([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch(`/api/student/labs?courseId=${courseId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [courseId])

  const submit = async () => {
    if (!title.trim()) {
      setError('Lab title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      let fileUrl: string | null = null
      let fileName: string | null = null
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('courseId', courseId)
        const up = await fetch('/api/student/labs/upload', {
          method: 'POST',
          credentials: 'same-origin',
          body: fd,
        })
        const upData = await up.json()
        if (!up.ok) throw new Error(upData.error || 'Upload failed')
        fileUrl = upData.url
        fileName = upData.fileName
      }

      const res = await fetch('/api/student/labs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title, notes, fileUrl, fileName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setTitle('')
      setNotes('')
      setFile(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900">
          <FlaskConical className="h-4 w-4" /> Lab submissions
        </CardTitle>
        <p className="text-xs text-slate-500">Upload lab work for lecturer review.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="space-y-3 border rounded-lg p-3 bg-slate-50/60">
          <div>
            <Label>Lab title</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Week 3 — PLC ladder logic" />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label>File (PDF, image, or document)</Label>
            <Input className="mt-1" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button type="button" onClick={submit} disabled={saving} className="bg-[var(--brand-navy)] text-white">
            <Upload className="h-4 w-4 mr-2" />
            {saving ? 'Submitting…' : 'Submit lab'}
          </Button>
        </div>
        {rows.length > 0 ? (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="border rounded-lg p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <Badge className={r.status === 'reviewed' ? 'bg-green-100 text-green-800' : r.status === 'resubmit' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}>
                    {r.status}
                  </Badge>
                </div>
                {r.file_url ? (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--brand-navy)] underline">
                    {r.file_name ?? 'Download file'}
                  </a>
                ) : null}
                {r.lecturer_feedback ? <p className="text-xs text-slate-600 mt-1">Feedback: {r.lecturer_feedback}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
