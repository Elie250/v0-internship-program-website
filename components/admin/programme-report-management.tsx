'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  getProgrammeReportEditorAction,
  listProgrammeReportAction,
  publishProgrammeReportAction,
  saveProgrammeReportAction,
  unpublishProgrammeReportAction,
} from '@/app/actions/admin-programme-reports'
import {
  REPORT_PROFILE_FIELDS,
  emptyEditorialReportProfile,
  missingRequiredPublishFields,
  reportProfilePatch,
  type EditorialReportProfile,
  type ReportProfileFieldKey,
  type ReportPublicationStatus,
} from '@/lib/learning/course-report-publication'

type ReportList = Awaited<ReturnType<typeof listProgrammeReportAction>>
type ReportCourse = Extract<ReportList, { ok: true }>['courses'][number]
type ReportEditor = Extract<Awaited<ReturnType<typeof getProgrammeReportEditorAction>>, { ok: true }>['editor']

function courseStatusLabel(status: string) {
  if (status === 'published') return 'Course published'
  if (status === 'pending_review') return 'Course pending review'
  if (status === 'archived') return 'Course archived'
  return 'Course draft'
}

function reportStatusLabel(status: ReportCourse['publicationStatus']) {
  if (status === 'published') return 'Report published'
  if (status === 'draft') return 'Report draft'
  return 'No report yet'
}

export default function ProgrammeReportManagement() {
  const [courses, setCourses] = useState<ReportCourse[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<ReportEditor | null>(null)
  const [form, setForm] = useState<EditorialReportProfile>(emptyEditorialReportProfile())
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function refreshList(keepId?: string | null) {
    const result = await listProgrammeReportAction()
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setCourses(result.courses)
    setWarning(result.warning)
    setLoading(false)
    const nextId = keepId && result.courses.some((course) => course.courseId === keepId) ? keepId : result.courses[0]?.courseId ?? null
    if (nextId && nextId !== selectedId) setSelectedId(nextId)
    if (!nextId) {
      setSelectedId(null)
      setEditor(null)
      setLoaded(false)
    }
  }

  useEffect(() => {
    void refreshList()
    // The list is loaded once when the section opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setLoaded(false)
    setError('')
    setSuccess('')
    getProgrammeReportEditorAction(selectedId).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setError(result.error)
        setEditor(null)
        setLoaded(false)
        return
      }
      setEditor(result.editor)
      setForm(result.editor.profile)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const sections = useMemo(() => {
    const groups: { title: string; fields: typeof REPORT_PROFILE_FIELDS[number][] }[] = []
    for (const field of REPORT_PROFILE_FIELDS) {
      const current = groups.find((group) => group.title === field.section)
      if (current) current.fields.push(field)
      else groups.push({ title: field.section, fields: [field] })
    }
    return groups
  }, [])

  const missing = missingRequiredPublishFields(form)
  const publicationStatus: ReportPublicationStatus = editor?.publicationStatus ?? 'draft'

  function updateField(key: ReportProfileFieldKey, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setSuccess('')
  }

  async function save() {
    if (!selectedId || !loaded) return
    const parsed = reportProfilePatch(form)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const result = await saveProgrammeReportAction(selectedId, form)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setEditor(result.editor)
    setForm(result.editor.profile)
    setSuccess('Report saved. Course publication was not changed.')
    await refreshList(selectedId)
  }

  async function publish() {
    if (!selectedId || !loaded) return
    const parsed = reportProfilePatch(form)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    if (missing.length > 0) {
      setError(`Add ${missing.join(', ')} before publishing.`)
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const saved = await saveProgrammeReportAction(selectedId, form)
    if (!saved.ok) {
      setSaving(false)
      setError(saved.error)
      return
    }
    const result = await publishProgrammeReportAction(selectedId)
    setSaving(false)
    if (!result.ok) {
      setEditor(saved.editor)
      setForm(saved.editor.profile)
      setError(result.error)
      return
    }
    setEditor(result.editor)
    setForm(result.editor.profile)
    setSuccess('Report published for admitted students. The course status was not changed.')
    await refreshList(selectedId)
  }

  async function unpublish() {
    if (!selectedId || !loaded) return
    setSaving(true)
    setError('')
    setSuccess('')
    const result = await unpublishProgrammeReportAction(selectedId)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setEditor(result.editor)
    setSuccess('Report unpublished. Admitted students no longer see this editorial copy.')
    await refreshList(selectedId)
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading programme reports…</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Programme reports</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Edit the brochure copy admitted students see on their programme report. Course title, thumbnail,
          category, duration, price, lessons, trainer, and timetable stay on the existing course records.
        </p>
      </div>

      {warning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{warning}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.length === 0 ? <p className="text-sm text-slate-600">No courses yet.</p> : null}
            {courses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                onClick={() => setSelectedId(course.courseId)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  course.courseId === selectedId ? 'border-[var(--brand-navy)] bg-slate-50' : 'border-slate-200'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{course.title}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {reportStatusLabel(course.publicationStatus)} · {course.filled}/{course.total} fields
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {editor && loaded ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{editor.title}</CardTitle>
                  <Badge variant="outline">{courseStatusLabel(editor.courseStatus)}</Badge>
                  <Badge variant="outline">{publicationStatus === 'published' ? 'Report published' : 'Report draft'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>Duration: {editor.duration || 'Not supplied'} · Price: {editor.pricing == null ? 'Not supplied' : editor.pricing <= 0 ? 'Free' : `${editor.pricing.toLocaleString()} RWF`}</p>
                <p>Publishing this report does not publish the course. Change the course from Programs / courses.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void save()} disabled={saving || !loaded}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="button" onClick={() => void publish()} disabled={saving || !loaded || missing.length > 0}>
                    Publish
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void unpublish()} disabled={saving || !loaded || publicationStatus !== 'published'}>
                    Unpublish
                  </Button>
                  <Link href={`/admin/dashboard/programme-reports/${editor.courseId}/preview`} target="_blank">
                    <Button type="button" variant="outline">Preview saved report</Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-500">Preview opens the last saved copy, including a draft.</p>
                {missing.length > 0 ? (
                  <p className="text-xs text-slate-500">Required before publishing: {missing.join(', ')}.</p>
                ) : (
                  <p className="text-xs text-slate-500">Required fields are complete. Optional fields can stay blank.</p>
                )}
              </CardContent>
            </Card>

            {sections.map((section) => (
              <Card key={section.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key}>
                        {field.label}{' '}
                        <span className="font-normal text-slate-500">
                          {field.requiredToPublish ? '(required to publish)' : '(optional)'}
                        </span>
                      </Label>
                      <Textarea
                        id={field.key}
                        value={form[field.key] ?? ''}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        rows={5}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-sm text-slate-600">
              {selectedId ? 'Loading report…' : 'Select a course to edit its programme report.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
