'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPES,
  programTypeNeedsLocation,
  programTypeNeedsMeetingLink,
  programTypeNeedsSchedule,
  type ProgramType,
} from '@/lib/enrollment/program-types'

const emptyForm = {
  title: '',
  description: '',
  program: '',
  program_type: 'training' as ProgramType,
  duration: '',
  pricing: '0',
  scheduled_at: '',
  location: '',
  meeting_link: '',
  program_end_date: '',
}

export function LecturerCreateCourseDialog({
  onCreated,
}: {
  onCreated: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const programType = form.program_type
  const showSchedule = programTypeNeedsSchedule(programType)
  const showLocation = programTypeNeedsLocation(programType)
  const showMeeting = programTypeNeedsMeetingLink(programType)

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError('Program title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/lecturer/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...form,
          pricing: Number(form.pricing),
          scheduled_at: form.scheduled_at || null,
          location: form.location || null,
          meeting_link: form.meeting_link || null,
          program_end_date: form.program_end_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit programme')

      setForm(emptyForm)
      setOpen(false)
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit programme')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Propose new programme
      </Button>

      <Dialog open={open} onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError('')
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto app-form-surface course-form-high-contrast">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Propose a new programme</DialogTitle>
            <p className="text-sm text-slate-600">
              Your programme is sent to admin for review. It becomes visible on /learning only after
              approval and publishing.
            </p>
          </DialogHeader>

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
                placeholder="Programme title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                placeholder="Overview, objectives, and who it is for"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Program track</Label>
                <Select
                  value={form.program || 'custom'}
                  onValueChange={(v) => setForm({ ...form, program: v === 'custom' ? '' : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_PROGRAMS.map((p) => (
                      <SelectItem key={p.id} value={p.title}>
                        {p.title}
                      </SelectItem>
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
              <Label>Price (RWF) — 0 = free</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={form.pricing}
                onChange={(e) => setForm({ ...form, pricing: e.target.value })}
              />
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
          </div>

          {error ? (
            <p className="text-sm text-red-800 bg-red-50 border border-red-300 rounded-md p-2">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={saving}
              className="bg-[var(--brand-navy)] text-white"
            >
              {saving ? 'Submitting…' : 'Submit for review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function courseStatusLabel(status: string) {
  if (status === 'published') return 'Published'
  if (status === 'pending_review') return 'Pending admin review'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

export function lecturerCourseStatusBadgeClass(status: string) {
  if (status === 'published') return 'bg-green-100 text-green-800'
  if (status === 'pending_review') return 'bg-blue-100 text-blue-900'
  return 'bg-amber-100 text-amber-900'
}

export { courseStatusLabel }
