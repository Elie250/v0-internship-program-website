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
import { Edit2, Plus, Trash2 } from 'lucide-react'

type Course = {
  id: string
  title: string
  description: string | null
  program?: string
  duration: string | null
  thumbnail: string | null
  pricing: number | null
  status: string
  created_at: string
}

const emptyForm = {
  title: '',
  description: '',
  program: '',
  duration: '',
  thumbnail: '',
  pricing: '0',
  status: 'published',
}

export default function CourseManagementTab() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
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
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')

      setForm(emptyForm)
      setIsCreateOpen(false)
      setSuccess(
        form.status === 'published'
          ? `Course "${data.title}" created and visible on /learning`
          : `Course "${data.title}" saved as draft — publish it to show on /learning`
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
    setEditForm({
      title: course.title,
      description: course.description || '',
      program: course.program || '',
      duration: course.duration || '',
      thumbnail: course.thumbnail || '',
      pricing: String(course.pricing ?? 0),
      status: course.status || 'draft',
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/courses/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          pricing: Number(editForm.pricing),
          thumbnail: editForm.thumbnail || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
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

  if (isLoading) {
    return <p className="text-muted-foreground">Loading courses...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Programs / Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage learning programmes. <strong>Published</strong> courses appear on the public{' '}
            <a href="/learning" target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] underline">
              Learning portal
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {courses.length === 0 ? (
            <Button variant="outline" onClick={seedDefaults} disabled={saving}>
              Seed 3 default programmes
            </Button>
          ) : null}
          <Button onClick={() => setIsCreateOpen(true)} className="bg-[#1e3a5f]">
            <Plus className="w-4 h-4 mr-2" />
            Create course
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setCreateError('')
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create course</DialogTitle>
          </DialogHeader>
          <CourseForm form={form} setForm={setForm} />
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#1e3a5f]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">No courses created yet.</p>
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
                <div className="h-40 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  No thumbnail
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    {course.program ? (
                      <p className="text-sm text-muted-foreground mt-1">{course.program}</p>
                    ) : null}
                  </div>
                  <Badge className={course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
                {course.duration ? (
                  <p className="text-sm">
                    <span className="font-semibold">Duration:</span> {course.duration}
                  </p>
                ) : null}
                <p className="text-sm font-medium text-[#1e3a5f]">
                  {Number(course.pricing ?? 0) > 0
                    ? `${Number(course.pricing).toLocaleString()} RWF`
                    : 'Free / pricing TBD'}
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
            <DialogTitle>Edit course</DialogTitle>
          </DialogHeader>
          <CourseForm form={editForm} setForm={setEditForm} />
          {editing ? <CourseContentPanel courseId={editing.id} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-[#1e3a5f]">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CourseForm({
  form,
  setForm,
}: {
  form: typeof emptyForm
  setForm: (value: typeof emptyForm) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Course title</Label>
        <Input
          className="mt-1"
          placeholder="e.g., Advanced Electrical Systems"
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price (RWF)</Label>
          <Input
            className="mt-1"
            type="number"
            value={form.pricing}
            onChange={(e) => setForm({ ...form, pricing: e.target.value })}
          />
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
      <ImageUploadField
        label="Course thumbnail"
        folder="courses"
        value={form.thumbnail}
        onChange={(url) => setForm({ ...form, thumbnail: url })}
      />
    </div>
  )
}
