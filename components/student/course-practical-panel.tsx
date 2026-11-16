'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PRACTICAL_ALLOWED_EXTENSIONS } from '@/lib/learning/practical-upload'

type PracticalListItem = {
  id: string
  kind: string
  kind_label: string
  title: string
  description: string | null
  passing_score: number
  due_at: string | null
  mySubmission: {
    status: string | null
    score: number | null
    passed: boolean
    feedback_summary: string | null
    submitted_at: string | null
    artifactCount: number
  }
}

type Artifact = {
  storage_key: string
  file_name: string
  content_type: string
  byte_size: number
  label: string
  id?: string
  download_path?: string
}

type PracticalBriefView = {
  learning_objectives: string[]
  prerequisites: string
  required_software: string[]
  optional_software: string[]
  alternative_software: string[]
  instructions: string
  expected_results: string
  simulation_requirements: string
  submission_requirements: string
  documentation_requirements: string
  safety_notes: string
  delivery_notes: string
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-slate-900">{title}</p>
      <div className="text-slate-700">{children}</div>
    </div>
  )
}

function renderBrief(brief: PracticalBriefView) {
  const sections: Array<{ title: string; node: React.ReactNode }> = []

  if (brief.learning_objectives?.length) {
    sections.push({
      title: 'Learning objectives',
      node: (
        <ul className="list-disc pl-5">
          {brief.learning_objectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    })
  }
  if (brief.prerequisites?.trim()) {
    sections.push({
      title: 'Prerequisites',
      node: <p className="whitespace-pre-wrap">{brief.prerequisites}</p>,
    })
  }
  if (brief.required_software?.length) {
    sections.push({
      title: 'Required software',
      node: (
        <ul className="list-disc pl-5">
          {brief.required_software.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    })
  }
  if (brief.optional_software?.length) {
    sections.push({
      title: 'Optional software',
      node: (
        <ul className="list-disc pl-5">
          {brief.optional_software.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    })
  }
  if (brief.alternative_software?.length) {
    sections.push({
      title: 'Alternative software',
      node: (
        <ul className="list-disc pl-5">
          {brief.alternative_software.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    })
  }
  if (brief.instructions?.trim()) {
    sections.push({
      title: 'Instructions',
      node: <p className="whitespace-pre-wrap">{brief.instructions}</p>,
    })
  }
  if (brief.expected_results?.trim()) {
    sections.push({
      title: 'Expected results',
      node: <p className="whitespace-pre-wrap">{brief.expected_results}</p>,
    })
  }
  if (brief.simulation_requirements?.trim()) {
    sections.push({
      title: 'Simulation / verification',
      node: <p className="whitespace-pre-wrap">{brief.simulation_requirements}</p>,
    })
  }
  if (brief.submission_requirements?.trim()) {
    sections.push({
      title: 'Submission requirements',
      node: <p className="whitespace-pre-wrap">{brief.submission_requirements}</p>,
    })
  }
  if (brief.documentation_requirements?.trim()) {
    sections.push({
      title: 'Documentation requirements',
      node: <p className="whitespace-pre-wrap">{brief.documentation_requirements}</p>,
    })
  }
  if (brief.safety_notes?.trim()) {
    sections.push({
      title: 'Safety notes',
      node: <p className="whitespace-pre-wrap">{brief.safety_notes}</p>,
    })
  }
  if (brief.delivery_notes?.trim()) {
    sections.push({
      title: 'Delivery notes',
      node: <p className="whitespace-pre-wrap">{brief.delivery_notes}</p>,
    })
  }

  return sections
}

export function CoursePracticalPanel({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<PracticalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{
    assessment: {
      title: string
      kind_label: string
      passing_score: number
      practical_brief: PracticalBriefView
      rubric: {
        title: string
        criteria: Array<{
          id: string
          title: string
          description: string
          max_points: number
          levels: Array<{ label: string; points: number; description: string }>
        }>
      } | null
    }
    submission: {
      id: string
      practical_status: string | null
      student_notes: string | null
      feedback_summary: string | null
      score: number | null
      passed: boolean | null
      artifacts: Array<Artifact>
      criterion_scores: Array<{ criterion_id: string; points_awarded: number; comment: string }>
    } | null
  } | null>(null)
  const [notes, setNotes] = useState('')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/student/assessments?courseId=${encodeURIComponent(courseId)}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load assessments')
      setItems(data.practicals ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const openDetail = async (id: string) => {
    setActiveId(id)
    setMessage('')
    setError('')
    const res = await fetch(`/api/student/practicals/${id}`, { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to open assessment')
      return
    }
    setDetail(data)
    setNotes(data.submission?.student_notes ?? '')
    setArtifacts(
      (data.submission?.artifacts ?? []).map((row: Artifact) => ({
        storage_key: row.storage_key,
        file_name: row.file_name,
        content_type: row.content_type,
        byte_size: row.byte_size,
        label: row.label,
        id: row.id,
        download_path: row.download_path,
      }))
    )
  }

  const status = detail?.submission?.practical_status ?? null
  const editable = !status || status === 'draft' || status === 'returned'

  const uploadFile = async (file: File) => {
    if (!activeId) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/student/practicals/${activeId}/upload`, {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setArtifacts((prev) => [
        ...prev,
        {
          storage_key: data.storageKey,
          file_name: data.fileName,
          content_type: data.contentType,
          byte_size: data.byteSize,
          label: '',
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const save = async (action: 'save' | 'submit') => {
    if (!activeId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/student/practicals/${activeId}/submission`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          student_notes: notes,
          artifacts,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage(action === 'submit' ? 'Submitted for marking.' : 'Draft saved.')
      await openDetail(activeId)
      await loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const briefSections = detail ? renderBrief(detail.assessment.practical_brief) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Practical assessments</CardTitle>
        <p className="text-xs text-slate-500">
          Individual software / simulation work. Physical PLC hardware is not required.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-green-800">{message}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">No published practical assessments yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.kind_label} · pass {item.passing_score}%
                    {item.mySubmission.status ? ` · ${item.mySubmission.status}` : ''}
                    {item.mySubmission.score != null ? ` · ${item.mySubmission.score}%` : ''}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => void openDetail(item.id)}>
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}

        {detail && activeId ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{detail.assessment.title}</h3>
                <p className="text-xs text-slate-500">
                  {detail.assessment.kind_label} · pass mark {detail.assessment.passing_score}%
                </p>
                <Badge className="mt-1">{status ?? 'not started'}</Badge>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setActiveId(null)}>
                Close
              </Button>
            </div>

            {briefSections.length ? (
              <section className="space-y-3 text-sm">
                {briefSections.map((section) => (
                  <BriefSection key={section.title} title={section.title}>
                    {section.node}
                  </BriefSection>
                ))}
              </section>
            ) : null}

            {detail.assessment.rubric ? (
              <section className="space-y-2">
                <p className="text-sm font-medium text-slate-900">{detail.assessment.rubric.title}</p>
                {detail.assessment.rubric.criteria.map((criterion) => (
                  <div key={criterion.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <p className="font-medium">
                      {criterion.title} ({criterion.max_points} pts)
                    </p>
                    <p className="text-slate-600">{criterion.description}</p>
                  </div>
                ))}
              </section>
            ) : null}

            {detail.submission?.feedback_summary ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-medium mb-1">Lecturer feedback</p>
                <p className="whitespace-pre-wrap">{detail.submission.feedback_summary}</p>
                {detail.submission.score != null ? (
                  <p className="mt-2">
                    Score: {detail.submission.score}%{' '}
                    {detail.submission.passed ? '(passed)' : '(not yet passed)'}
                  </p>
                ) : null}
              </div>
            ) : null}

            {editable ? (
              <>
                <div>
                  <Label>Technical explanation / notes</Label>
                  <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>
                    Evidence files (max 25 MB each). Allowed: {PRACTICAL_ALLOWED_EXTENSIONS.join(', ')}
                  </Label>
                  <InputFile disabled={uploading} onFile={(file) => void uploadFile(file)} />
                  <ul className="space-y-1 text-sm">
                    {artifacts.map((file, index) => (
                      <li key={`${file.storage_key}-${index}`} className="flex justify-between gap-2">
                        <span>{file.file_name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setArtifacts((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || uploading}
                    onClick={() => void save('save')}
                  >
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || uploading}
                    className="bg-[var(--brand-navy)] text-white"
                    onClick={() => void save('submit')}
                  >
                    Submit for marking
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  This submission is awaiting marking or has been finalized.
                </p>
                {artifacts.length ? (
                  <ul className="space-y-1 text-sm">
                    {artifacts.map((file, index) => (
                      <li key={`${file.storage_key}-${index}`}>
                        {file.download_path ? (
                          <a
                            className="text-[var(--brand-navy)] underline"
                            href={file.download_path}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.file_name}
                          </a>
                        ) : (
                          file.file_name
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function InputFile({
  disabled,
  onFile,
}: {
  disabled?: boolean
  onFile: (file: File) => void
}) {
  return (
    <input
      type="file"
      disabled={disabled}
      accept={PRACTICAL_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) onFile(file)
        event.target.value = ''
      }}
    />
  )
}
