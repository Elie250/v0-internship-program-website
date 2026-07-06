'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CourseContentPanel } from '@/components/admin/course-content-panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPES,
  programTypeNeedsLocation,
  programTypeNeedsMeetingLink,
  programTypeNeedsSchedule,
  type ProgramType,
} from '@/lib/enrollment/program-types'
import { Edit2, Plus, Trash2 } from 'lucide-react'

type Course = {
  id: string
  title: string
  description: string | null
  program?: string
  program_type?: ProgramType
  instructor_id?: string | null
  duration: string | null
  thumbnail: string | null
  pricing: number | null
  status: string
  scheduled_at?: string | null
  location?: string | null
  meeting_link?: string | null
  program_end_date?: string | null
  created_at: string
}

const emptyForm = {
  title: '',
  description: '',
  program: '',
  program_type: 'training' as ProgramType,
  duration: '',
  thumbnail: '',
  pricing: '0',
  status: 'published',
  scheduled_at: '',
  location: '',
  meeting_link: '',
  program_end_date: '',
  instructor_id: 'none',
}

type LecturerOption = { id: string; name: string; email: string }

export default function CourseManagementTab() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<LecturerOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [createError, setCreateError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const loadLecturers = async () => {
    try {
      const res = await fetch('/api/admin/lecturers', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to load lecturers:', data.error)
        setLecturers([])
        return
      }
      setLecturers(Array.isArray(data) ? data : [])
    } catch {
      setLecturers([])
    }
  }

  const load = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load courses')
        setCourses([])
        return
      }
      setCourses(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      console.error('Failed to fetch courses:', err)
      setError('Failed to load courses. Try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadLecturers()
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setCreateError('Course title is required')
      return
    }
    setSaving(true)
    setCreateError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricing: Number(form.pricing),
          thumbnail: form.thumbnail || null,
          scheduled_at: form.scheduled_at || null,
          location: form.location || null,
          meeting_link: form.meeting_link || null,
          program_end_date: form.program_end_date || null,
          instructor_id: form.instructor_id === 'none' ? null : form.instructor_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')

      setForm(emptyForm)
      setIsCreateOpen(false)
      setSuccess(
        form.status === 'published'
          ? `Program "${data.title}" created and visible to students`
          : `Program "${data.title}" saved as draft`
      )
      await load()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const seedDefaults = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedDefaults: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Seed failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setEditError('')
    void loadLecturers()
    const instructorId = course.instructor_id || 'none'
    setEditForm({
      title: course.title,
      description: course.description || '',
      program: course.program || '',
      program_type: course.program_type || 'training',
      duration: course.duration || '',
      thumbnail: course.thumbnail || '',
      pricing: String(course.pricing ?? 0),
      status: course.status || 'draft',
      scheduled_at: course.scheduled_at ? course.scheduled_at.slice(0, 16) : '',
      location: course.location || '',
      meeting_link: course.meeting_link || '',
      program_end_date: course.program_end_date ? course.program_end_date.slice(0, 16) : '',
      instructor_id: instructorId,
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    if (!editForm.title.trim()) {
      setEditError('Course title is required')
      return
    }
    setSaving(true)
    setEditError('')
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/courses/${editing.id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description,
          program: editForm.program,
          program_type: editForm.program_type,
          duration: editForm.duration,
          pricing: Number(editForm.pricing),
          status: editForm.status,
          thumbnail: editForm.thumbnail || null,
          scheduled_at: editForm.scheduled_at || null,
          location: editForm.location || null,
          meeting_link: editForm.meeting_link || null,
          program_end_date: editForm.program_end_date || null,
          instructor_id: editForm.instructor_id === 'none' ? null : editForm.instructor_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setEditing(null)
      setSuccess(`"${editForm.title}" saved${editForm.instructor_id !== 'none' ? ' — lecturer assigned' : ''}`)
      await load()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (course: Course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(
        nextStatus === 'published'
          ? `"${course.title}" is now live on /learning`
          : `"${course.title}" unpublished`
      )
      load()
    } else {
      setError(data.error || 'Publish failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
    load()
  }

  const publishedCount = courses.filter((c) => c.status === 'published').length

  if (isLoading) {
    return <p className="text-slate-600">Loading courses...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
          <p className="text-slate-600 mt-1">
            Create training, internship, mentorship, career guidance, workshops, webinars, and events.
            Set price to <strong>0</strong> for free programmes (instant student access). Paid programmes
            require MoMo verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {courses.length === 0 ? (
            <Button variant="outline" onClick={seedDefaults} disabled={saving}>
              Seed 3 default programmes
            </Button>
          ) : null}
          <Button onClick={() => setIsCreateOpen(true)} className="bg-[var(--brand-navy)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create program
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      {courses.length > 0 && publishedCount === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-900">
            You have {courses.length} course(s) in the database, but none are <strong>Published</strong>.
            Draft courses are hidden from the public{' '}
            <a href="/learning" target="_blank" rel="noopener noreferrer" className="underline">/learning</a> page.
            Click <strong>Publish</strong> on each course card below.
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setCreateError('')
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Create program</DialogTitle>
          </DialogHeader>
          <CourseForm form={form} setForm={setForm} lecturers={lecturers} />
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[var(--brand-navy)] text-white">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-slate-600">No courses created yet.</p>
            <Button variant="outline" onClick={seedDefaults} disabled={saving}>
              Add Embedded Systems, Industrial Control & Advanced Electrical
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              {course.thumbnail ? (
                <div className="relative h-40">
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="h-40 bg-muted flex items-center justify-center text-sm text-slate-600">
                  No thumbnail
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-slate-900">{course.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-slate-700">
                        {PROGRAM_TYPE_LABELS[course.program_type ?? 'training']}
                      </Badge>
                      {Number(course.pricing ?? 0) <= 0 ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : null}
                    </div>
                    {course.program ? (
                      <p className="text-sm text-slate-600 mt-1">{course.program}</p>
                    ) : null}
                  </div>
                  <Badge className={course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 line-clamp-3">{course.description}</p>
                {course.duration ? (
                  <p className="text-sm">
                    <span className="font-semibold text-slate-800">Duration:</span> {course.duration}
                  </p>
                ) : null}
                {course.instructor_id ? (
                  <p className="text-xs text-slate-600">
                    Lecturer:{' '}
                    {lecturers.find((l) => l.id === course.instructor_id)?.name ?? 'Assigned'}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">No lecturer assigned</p>
                )}
                <p className="text-sm font-medium text-[var(--brand-navy)]">
                  {Number(course.pricing ?? 0) > 0
                    ? `${Number(course.pricing).toLocaleString()} RWF`
                    : 'Free — instant access'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(course)}>
                    {course.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(course)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit program</DialogTitle>
          </DialogHeader>
          <CourseForm form={editForm} setForm={setEditForm} lecturers={lecturers} />
          {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
          {editing ? <CourseContentPanel courseId={editing.id} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-[var(--brand-navy)] text-white">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CourseForm({
  form,
  setForm,
  lecturers,
}: {
  form: typeof emptyForm
  setForm: (value: typeof emptyForm) => void
  lecturers: LecturerOption[]
}) {
  const programType = form.program_type
  const showSchedule = programTypeNeedsSchedule(programType)
  const showLocation = programTypeNeedsLocation(programType)
  const showMeeting = programTypeNeedsMeetingLink(programType)

  return (
    <div className="space-y-4">
      <div>
        <Label>Program type</Label>
        <Select
          value={programType}
          onValueChange={(v) => setForm({ ...form, program_type: v as ProgramType })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROGRAM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {PROGRAM_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          className="mt-1"
          placeholder="Program title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          className="mt-1"
          placeholder="Course overview and objectives"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Program track</Label>
          <Select value={form.program || 'custom'} onValueChange={(v) => setForm({ ...form, program: v === 'custom' ? '' : v })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select programme" />
            </SelectTrigger>
            <SelectContent>
              {TRAINING_PROGRAMS.map((p) => (
                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
              ))}
              <SelectItem value="custom">Other / custom</SelectItem>
            </SelectContent>
          </Select>
          {!TRAINING_PROGRAMS.some((p) => p.title === form.program) && form.program ? (
            <Input
              className="mt-2"
              placeholder="Custom programme name"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
            />
          ) : null}
        </div>
        <div>
          <Label>Duration</Label>
          <Input
            className="mt-1"
            placeholder="e.g., 6 weeks"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Assigned lecturer</Label>
        <Select
          value={
            lecturers.some((l) => l.id === form.instructor_id) || form.instructor_id === 'none'
              ? form.instructor_id || 'none'
              : 'none'
          }
          onValueChange={(v) => setForm({ ...form, instructor_id: v })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select approved lecturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Not assigned —</SelectItem>
            {lecturers.map((lecturer) => (
              <SelectItem key={lecturer.id} value={lecturer.id}>
                {lecturer.name} ({lecturer.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1">
          Only admin-approved lecturer accounts appear here. Pending registrations must be approved
          under User Management first.
        </p>
        {lecturers.length === 0 ? (
          <p className="text-xs text-amber-700 mt-1">
            No active lecturers yet — approve lecturer registrations in User Management.
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price (RWF) — 0 = free</Label>
          <Input
            className="mt-1"
            type="number"
            min={0}
            value={form.pricing}
            onChange={(e) => setForm({ ...form, pricing: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">Free programmes skip payment approval.</p>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {showSchedule ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start date & time</Label>
            <Input
              type="datetime-local"
              className="mt-1"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>
          {programType === 'event' ? (
            <div>
              <Label>End date & time</Label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={form.program_end_date}
                onChange={(e) => setForm({ ...form, program_end_date: e.target.value })}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {showLocation ? (
        <div>
          <Label>Location</Label>
          <Input
            className="mt-1"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
      ) : null}
      {showMeeting ? (
        <div>
          <Label>Meeting / join link</Label>
          <Input
            className="mt-1"
            value={form.meeting_link}
            onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
          />
        </div>
      ) : null}
      <ImageUploadField
        label="Thumbnail"
        folder="courses"
        value={form.thumbnail}
        onChange={(url) => setForm({ ...form, thumbnail: url })}
      />
    </div>
  )
}
