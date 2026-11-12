'use client'

import { LessonBlockEditor } from '@/components/learning/lesson-block-editor'
import { LessonBlockRenderer } from '@/components/learning/lesson-block-renderer'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  COURSE_CONTENT_TYPES,
  INTERACTIVE_CONTENT_OPTION,
  INTERACTIVE_CONTENT_TYPE,
  contentUrlPlaceholder,
  requiresContentUrl,
  type CourseContentType,
} from '@/lib/learning/course-content-types'
import { useOptionalLessonEditorGuard } from '@/components/learning/lesson-editor-guard'
import { UnsavedLessonDialog } from '@/components/learning/unsaved-lesson-dialog'
import { lessonBlocksToEditor, previewLessonBlocks, type EditorLessonBlock } from '@/lib/learning/lesson-authoring'
import { parseLessonBody } from '@/lib/learning/lesson-blocks'
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
} from '@/lib/learning/curriculum-workload'
import {
  isLessonEditorDirty,
  resolveUnsavedNavigation,
  type UnsavedNavigationChoice,
} from '@/lib/learning/lesson-editor-guard'
import { isPublishedLessonVisibility } from '@/lib/learning/lesson-visibility'
import { ExternalLink, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Lesson = {
  id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
  body?: unknown
  visibility?: string | null
  estimated_minutes?: number | null
  activity_kind?: string | null
}

type CourseLessonManagerProps = {
  courseId: string
  mode: 'lecturer' | 'admin'
  onFeedback?: (message: { type: 'success' | 'error'; text: string }) => void
}

const EMPTY_FORM = {
  title: '',
  content_type: 'video',
  content_url: '',
  estimated_minutes: '',
  activity_kind: '',
}

export function CourseLessonManager({ courseId, mode, onFeedback }: CourseLessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [blocks, setBlocks] = useState<EditorLessonBlock[]>([])
  const [initialBlocks, setInitialBlocks] = useState<EditorLessonBlock[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState('')
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveSaving, setLeaveSaving] = useState(false)
  const leaveResolverRef = useRef<((allow: boolean) => void) | null>(null)
  const leavePromiseRef = useRef<Promise<boolean> | null>(null)
  const guard = useOptionalLessonEditorGuard()

  const contentBase =
    mode === 'lecturer'
      ? `/api/lecturer/courses/${courseId}/content`
      : `/api/admin/courses/${courseId}/content`
  const uploadUrl =
    mode === 'lecturer'
      ? `/api/lecturer/courses/${courseId}/content/upload`
      : `/api/admin/courses/${courseId}/content/upload`
  const itemBase = mode === 'lecturer' ? '/api/lecturer/course-content' : '/api/admin/course-content'

  const isInteractive = form.content_type === INTERACTIVE_CONTENT_TYPE
  const dirty = useMemo(
    () =>
      isLessonEditorDirty(
        {
          title: form.title,
          content_type: form.content_type,
          content_url: form.content_url,
          estimated_minutes: form.estimated_minutes,
          activity_kind: form.activity_kind,
          blocks,
        },
        {
          title: initialForm.title,
          content_type: initialForm.content_type,
          content_url: initialForm.content_url,
          estimated_minutes: initialForm.estimated_minutes,
          activity_kind: initialForm.activity_kind,
          blocks: initialBlocks,
        }
      ),
    [blocks, form, initialBlocks, initialForm]
  )
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

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

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const requestLeave = useCallback(() => {
    if (!dirtyRef.current) return Promise.resolve(true)
    if (leavePromiseRef.current) return leavePromiseRef.current
    setLeaveOpen(true)
    const pending = new Promise<boolean>((resolve) => {
      leaveResolverRef.current = resolve
    })
    leavePromiseRef.current = pending
    return pending
  }, [])

  useEffect(() => {
    guard?.registerLeaveHandler(requestLeave)
    return () => guard?.registerLeaveHandler(null)
  }, [guard, requestLeave])

  const resetEditor = (next = EMPTY_FORM, nextBlocks: EditorLessonBlock[] = []) => {
    setForm(next)
    setInitialForm(next)
    setBlocks(nextBlocks)
    setInitialBlocks(nextBlocks)
    setEditingId(null)
  }

  const uploadFile = async (file: File): Promise<string> => {
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
            ? 'Storage rejected this file type — check the file format or contact admin.'
            : `Storage upload failed (${putRes.status})`
        )
      }
      if (!target.publicUrl) throw new Error('Upload failed')
      return target.publicUrl as string
    }

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
    if (!data.url) throw new Error('Upload failed')
    return data.url as string
  }

  const persistLesson = async (
    payload: Record<string, unknown>,
    lessonId?: string | null
  ): Promise<boolean> => {
    const res = await fetch(lessonId ? `${itemBase}/${lessonId}` : contentBase, {
      method: lessonId ? 'PATCH' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify('error', data.error || 'Failed to save lesson')
      return false
    }
    return true
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setLocalError('')
    try {
      const url = await uploadFile(file)
      setForm((current) => ({ ...current, content_url: url }))

      const fallbackTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
      const title = form.title.trim() || fallbackTitle || 'New lesson'
      const saved = await persistLesson({
        title,
        content_type: form.content_type,
        content_url: url,
        estimated_minutes: form.estimated_minutes.trim(),
        activity_kind: form.activity_kind.trim(),
      })
      if (saved) {
        resetEditor({
          ...EMPTY_FORM,
          content_type: form.content_type,
        })
        notify('success', `Lesson "${title}" uploaded and saved — students can see it now.`)
        await load()
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const visibilityForLeaveSave = () => {
    if (form.content_type === INTERACTIVE_CONTENT_TYPE) {
      if (!editingId) return 'draft' as const
      const existing = lessons.find((lesson) => lesson.id === editingId)
      return isPublishedLessonVisibility(existing?.visibility) ? 'published' : 'draft'
    }
    return 'published' as const
  }

  const handleSave = async (visibility: 'draft' | 'published'): Promise<boolean> => {
    if (!form.title.trim()) {
      notify('error', 'Lesson title is required')
      return false
    }
    if (requiresContentUrl(form.content_type as CourseContentType) && !form.content_url.trim()) {
      notify('error', 'Add a URL or upload a file first')
      return false
    }

    setLoading(true)
    setLocalError('')
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        content_type: form.content_type,
        content_url: form.content_url.trim() || null,
        visibility,
        estimated_minutes: form.estimated_minutes.trim(),
        activity_kind: form.activity_kind.trim(),
      }
      if (isInteractive) {
        payload.body = blocks
      }

      const saved = await persistLesson(payload, editingId)
      if (saved) {
        resetEditor()
        notify(
          'success',
          visibility === 'published'
            ? 'Lesson published — admitted students can see it now.'
            : 'Draft saved. Students cannot see this lesson yet.'
        )
        await load()
        return true
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const settleLeave = (allow: boolean) => {
    setLeaveOpen(false)
    setLeaveSaving(false)
    leavePromiseRef.current = null
    leaveResolverRef.current?.(allow)
    leaveResolverRef.current = null
  }

  const handleLeaveChoice = async (choice: UnsavedNavigationChoice) => {
    const decision = resolveUnsavedNavigation(choice)
    if (decision.persist) {
      setLeaveSaving(true)
      const saved = await handleSave(visibilityForLeaveSave())
      if (!saved) {
        setLeaveSaving(false)
        return
      }
      settleLeave(true)
      return
    }
    if (decision.discard) resetEditor()
    settleLeave(decision.allow)
  }

  const handleAddUrlLesson = async () => {
    await handleSave('published')
  }

  const startEdit = async (lesson: Lesson) => {
    if (!(await requestLeave())) return
    const nextForm = {
      title: lesson.title,
      content_type: lesson.content_type,
      content_url: lesson.content_url ?? '',
      estimated_minutes:
        lesson.estimated_minutes != null && Number(lesson.estimated_minutes) > 0
          ? String(lesson.estimated_minutes)
          : '',
      activity_kind: lesson.activity_kind ? String(lesson.activity_kind) : '',
    }
    const nextBlocks = lessonBlocksToEditor(parseLessonBody(lesson.body))
    setEditingId(lesson.id)
    setForm(nextForm)
    setInitialForm(nextForm)
    setBlocks(nextBlocks)
    setInitialBlocks(nextBlocks)
  }

  const handleDelete = async (id: string) => {
    if (editingId === id && !(await requestLeave())) return
    if (!confirm('Remove this lesson?')) return
    const res = await fetch(`${itemBase}/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      notify('error', data.error || 'Failed to delete lesson')
      return
    }
    if (editingId === id) resetEditor()
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
        URL materials are visible to admitted students as soon as you add them. Interactive lessons
        start as drafts until you publish.
      </p>

      {lessons.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {lessons.map((lesson) => {
            const published = isPublishedLessonVisibility(lesson.visibility)
            return (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-2 rounded border px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="font-medium">{lesson.title}</span>{' '}
                  <span className="text-muted-foreground">({lesson.content_type})</span>
                  <Badge
                    variant="outline"
                    className={
                      published
                        ? 'ml-2 border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'ml-2 border-amber-200 bg-amber-50 text-amber-800'
                    }
                  >
                    {published ? 'Published' : 'Draft'}
                  </Badge>
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
                <span className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(lesson)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit lesson</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lesson.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No lessons yet — add videos, webinar links, PDFs, or an interactive lesson below.
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
              <SelectItem value={INTERACTIVE_CONTENT_OPTION.value}>
                {INTERACTIVE_CONTENT_OPTION.label}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estimated minutes</Label>
          <Input
            className="mt-1"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="e.g. 45"
            value={form.estimated_minutes}
            onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
          />
          <p className="text-xs text-slate-600 mt-1">
            Author-entered learning time only. Not inferred from video or text length.
          </p>
        </div>
        <div>
          <Label>Activity kind</Label>
          <Select
            value={form.activity_kind || 'none'}
            onValueChange={(v) => setForm({ ...form, activity_kind: v === 'none' ? '' : v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              {ACTIVITY_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {ACTIVITY_KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isInteractive ? (
          <div className="sm:col-span-2 space-y-3">
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="pt-3">
                <LessonBlockEditor
                  blocks={blocks}
                  onChange={setBlocks}
                  onUploadFile={uploadFile}
                  disabled={loading || uploading}
                />
              </TabsContent>
              <TabsContent value="preview" className="pt-3">
                {previewLessonBlocks(blocks).length ? (
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <LessonBlockRenderer blocks={previewLessonBlocks(blocks)} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Add valid blocks to preview the student lesson.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="sm:col-span-2">
              <Label>URL</Label>
              <Input
                className="mt-1"
                value={form.content_url}
                onChange={(e) => setForm({ ...form, content_url: e.target.value })}
                placeholder={contentUrlPlaceholder(form.content_type as CourseContentType)}
              />
            </div>
            {showUpload ? (
              <div className="sm:col-span-2">
                <Label>Or upload a file</Label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
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
                      <Upload className="h-3 w-3" /> PDF, video, or slides up to 25 MB — the lesson
                      saves automatically after upload
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          {isInteractive || editingId ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={loading || uploading}
              >
                {loading ? 'Saving…' : 'Save draft'}
              </Button>
              <Button
                type="button"
                onClick={() => handleSave('published')}
                disabled={loading || uploading}
                className="bg-[var(--brand-navy)] text-white"
              >
                {loading ? 'Publishing…' : 'Publish'}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void (async () => {
                      if (!(await requestLeave())) return
                      resetEditor()
                    })()
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type="button"
              onClick={handleAddUrlLesson}
              disabled={loading || uploading}
              className="bg-[var(--brand-navy)] text-white"
            >
              {loading ? 'Adding…' : 'Add lesson'}
            </Button>
          )}
        </div>
      </div>

      <UnsavedLessonDialog open={leaveOpen} saving={leaveSaving} onChoice={handleLeaveChoice} />
    </div>
  )
}
