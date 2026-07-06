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
import { COURSE_CONTENT_TYPES, contentUrlPlaceholder } from '@/lib/learning/course-content-types'
import { ExternalLink, Loader2, Trash2, Upload } from 'lucide-react'

type Lesson = {
  id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
}

type CourseLessonManagerProps = {
  courseId: string
  mode: 'lecturer' | 'admin'
  onFeedback?: (message: { type: 'success' | 'error'; text: string }) => void
}

export function CourseLessonManager({ courseId, mode, onFeedback }: CourseLessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [form, setForm] = useState({
    title: '',
    content_type: 'video',
    content_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState('')

  const contentBase =
    mode === 'lecturer'
      ? `/api/lecturer/courses/${courseId}/content`
      : `/api/admin/courses/${courseId}/content`
  const uploadUrl =
    mode === 'lecturer'
      ? `/api/lecturer/courses/${courseId}/content/upload`
      : `/api/admin/courses/${courseId}/content/upload`
  const deleteBase =
    mode === 'lecturer' ? '/api/lecturer/course-content' : '/api/admin/course-content'

  const notify = useCallback(
    (type: 'success' | 'error', text: string) => {
      if (onFeedback) onFeedback({ type, text })
      else if (type === 'error') setLocalError(text)
    },
    [onFeedback]
  )

  const load = useCallback(async () => {
    const res = await fetch(contentBase, { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) {
      notify('error', data.error || 'Failed to load lessons')
      return
    }
    setLessons(Array.isArray(data) ? data : [])
  }, [contentBase, notify])

  useEffect(() => {
    void load()
  }, [load])

  const addLesson = async (payload: {
    title: string
    content_type: string
    content_url: string
  }): Promise<boolean> => {
    const res = await fetch(contentBase, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify('error', data.error || 'Failed to add lesson')
      return false
    }
    return true
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setLocalError('')
    try {
      let url: string | null = null

      // Direct-to-storage upload (bypasses serverless body size limits)
      const targetRes = await fetch(`${uploadUrl}-url`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
      })
      const target = await targetRes.json().catch(() => ({}))

      if (targetRes.ok && target.signedUrl) {
        const putRes = await fetch(target.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': target.contentType || file.type || 'application/octet-stream' },
          body: file,
        })
        if (!putRes.ok) {
          const text = await putRes.text().catch(() => '')
          const mimeBlocked = /mime|not supported/i.test(text)
          throw new Error(
            mimeBlocked
              ? 'Storage bucket rejected this file type — run scripts/25-platform-media-course-materials.sql in Supabase.'
              : `Storage upload failed (${putRes.status})`
          )
        }
        url = target.publicUrl
      } else {
        // Fallback to legacy server-side upload (small files only)
        const body = new FormData()
        body.append('file', file)
        const res = await fetch(uploadUrl, {
          method: 'POST',
          credentials: 'same-origin',
          body,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            data.hint ? `${data.error} — ${data.hint}` : data.error || target.error || 'Upload failed'
          )
        }
        url = data.url
      }

      if (!url) throw new Error('Upload failed')

      setForm((current) => ({ ...current, content_url: url as string }))

      // Auto-save the lesson immediately so the upload is never lost
      const fallbackTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
      const title = form.title.trim() || fallbackTitle || 'New lesson'
      const saved = await addLesson({
        title,
        content_type: form.content_type,
        content_url: url,
      })
      if (saved) {
        setForm({ title: '', content_type: form.content_type, content_url: '' })
        notify('success', `Lesson "${title}" uploaded and saved — students can see it now.`)
        await load()
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async () => {
    if (!form.title.trim()) {
      notify('error', 'Lesson title is required')
      return
    }
    if (!form.content_url.trim()) {
      notify('error', 'Add a URL or upload a file first')
      return
    }

    setLoading(true)
    setLocalError('')
    try {
      const saved = await addLesson({
        title: form.title.trim(),
        content_type: form.content_type,
        content_url: form.content_url.trim(),
      })
      if (saved) {
        setForm({ title: '', content_type: 'video', content_url: '' })
        notify(
          'success',
          'Lesson added — admitted students will see it on their course page immediately.'
        )
        await load()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this lesson?')) return
    const res = await fetch(`${deleteBase}/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      notify('error', data.error || 'Failed to delete lesson')
      return
    }
    notify('success', 'Lesson removed')
    await load()
  }

  const showUpload =
    form.content_type === 'pdf' ||
    form.content_type === 'document' ||
    form.content_type === 'download' ||
    form.content_type === 'video'

  return (
    <div className="space-y-4">
      {localError && !onFeedback ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {localError}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Materials you add here are shared with all admitted students for this programme — no extra
        steps needed.
      </p>

      {lessons.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between gap-2 rounded border px-3 py-2"
            >
              <span className="min-w-0">
                <span className="font-medium">{lesson.title}</span>{' '}
                <span className="text-muted-foreground">({lesson.content_type})</span>
                {lesson.content_url ? (
                  <a
                    href={lesson.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-0.5 text-xs text-[var(--brand-navy)] underline"
                  >
                    Preview <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(lesson.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No lessons yet — add videos, webinar links, PDFs, or other files below.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3 border-t pt-4">
        <div className="sm:col-span-2">
          <Label>Lesson title</Label>
          <Input
            className="mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Week 1 — Introduction"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Material type</Label>
          <Select
            value={form.content_type}
            onValueChange={(v) => setForm({ ...form, content_type: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_CONTENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>URL</Label>
          <Input
            className="mt-1"
            value={form.content_url}
            onChange={(e) => setForm({ ...form, content_url: e.target.value })}
            placeholder={contentUrlPlaceholder(
              form.content_type as (typeof COURSE_CONTENT_TYPES)[number]['value']
            )}
          />
        </div>
        {showUpload ? (
          <div className="sm:col-span-2">
            <Label>Or upload a file</Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {/* No accept filter: the picker opens on "All Files" so PDFs and
                  documents are selectable on mobile (image/* was forcing the
                  photo gallery) and desktop no longer defaults to Custom Files. */}
              <Input
                type="file"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                  e.target.value = ''
                }}
              />
              {uploading ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading &amp; saving lesson…
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="h-3 w-3" /> PDF, video, or slides up to 25 MB — the lesson saves
                  automatically after upload
                </span>
              )}
            </div>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button
            type="button"
            onClick={handleAdd}
            disabled={loading || uploading}
            className="bg-[var(--brand-navy)] text-white"
          >
            {loading ? 'Adding…' : 'Add lesson'}
          </Button>
        </div>
      </div>
    </div>
  )
}
