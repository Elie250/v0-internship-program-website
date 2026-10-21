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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import {
  formatPlatformDateTime,
  serializePlatformDateTime,
  toPlatformDatetimeLocal,
} from '@/lib/platform/rwanda-datetime'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Webinar = {
  id: string
  title: string
  description: string | null
  scheduled_at: string | null
  meeting_link: string | null
  recording_url: string | null
  thumbnail_url?: string | null
  status: string
  is_paid?: boolean
  price?: number | null
  host_user_id?: string | null
  host_name?: string | null
  host_role?: string | null
}

type Host = {
  id: string
  name: string
  email: string
  role: string
}

type FormState = {
  title: string
  description: string
  scheduled_at: string
  meeting_link: string
  recording_url: string
  thumbnail_url: string
  status: string
  is_paid: boolean
  price: string
  host_user_id: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  scheduled_at: '',
  meeting_link: '',
  recording_url: '',
  thumbnail_url: '',
  status: 'draft',
  is_paid: false,
  price: '',
  host_user_id: '',
}

const UNASSIGNED = 'unassigned'

function formFromWebinar(w: Webinar): FormState {
  return {
    title: w.title ?? '',
    description: w.description ?? '',
    scheduled_at: toPlatformDatetimeLocal(w.scheduled_at),
    meeting_link: w.meeting_link ?? '',
    recording_url: w.recording_url ?? '',
    thumbnail_url: w.thumbnail_url ?? '',
    status: w.status || 'draft',
    is_paid: Boolean(w.is_paid),
    price: w.is_paid && w.price != null ? String(w.price) : '',
    host_user_id: w.host_user_id ?? '',
  }
}

function payloadFromForm(form: FormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    scheduled_at: serializePlatformDateTime(form.scheduled_at),
    meeting_link: form.meeting_link.trim() || null,
    recording_url: form.recording_url.trim() || null,
    thumbnail_url: form.thumbnail_url.trim() || null,
    status: form.status,
    is_paid: form.is_paid,
    price: form.is_paid ? Number(form.price || 0) : 0,
    host_user_id: form.host_user_id || null,
  }
}

function WebinarFields({
  form,
  setForm,
  hosts,
}: {
  form: FormState
  setForm: (next: FormState) => void
  hosts: Host[]
}) {
  const patch = (partial: Partial<FormState>) => setForm({ ...form, ...partial })

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Title</Label>
        <Input className="mt-1" value={form.title} onChange={(e) => patch({ title: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <Label>Description</Label>
        <Textarea
          className="mt-1"
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <ImageUploadField
          label="Thumbnail"
          folder="webinars"
          value={form.thumbnail_url}
          onChange={(url) => patch({ thumbnail_url: url })}
        />
      </div>
      <div>
        <Label>Date & time (Rwanda)</Label>
        <Input
          type="datetime-local"
          className="mt-1"
          value={form.scheduled_at}
          onChange={(e) => patch({ scheduled_at: e.target.value })}
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => patch({ status: v })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Meeting link (Zoom/Meet)</Label>
        <Input className="mt-1" value={form.meeting_link} onChange={(e) => patch({ meeting_link: e.target.value })} />
      </div>
      <div>
        <Label>Recording URL</Label>
        <Input className="mt-1" value={form.recording_url} onChange={(e) => patch({ recording_url: e.target.value })} />
      </div>
      <div>
        <Label>Access</Label>
        <Select
          value={form.is_paid ? 'paid' : 'free'}
          onValueChange={(v) => patch({ is_paid: v === 'paid', price: v === 'paid' ? form.price : '' })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Price (RWF)</Label>
        <Input
          type="number"
          min={0}
          className="mt-1"
          placeholder="0"
          disabled={!form.is_paid}
          value={form.price}
          onChange={(e) => patch({ price: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <Label>Assign host (lecturer / engineer)</Label>
        <Select
          value={form.host_user_id || UNASSIGNED}
          onValueChange={(v) => patch({ host_user_id: v === UNASSIGNED ? '' : v })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {hosts.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name} · {h.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default function WebinarManagement() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Webinar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/webinars')
    const data = await res.json()
    setWebinars(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const loadHosts = async () => {
    const res = await fetch('/api/admin/webinars/hosts')
    const data = await res.json()
    setHosts(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    void load()
    void loadHosts()
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFromForm(form)),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Could not create webinar.')
      return
    }
    setForm(emptyForm)
    void load()
  }

  const handleUpdate = async () => {
    if (!editing) return
    if (!editForm.title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/webinars/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFromForm(editForm)),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Could not update webinar.')
      return
    }
    setEditing(null)
    void load()
  }

  const togglePublish = async (w: Webinar) => {
    const status = w.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/webinars/${w.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    void load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete webinar?')) return
    await fetch(`/api/admin/webinars/${id}`, { method: 'DELETE' })
    void load()
  }

  if (loading) return <p className="text-slate-600">Loading webinars…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webinars</h1>
        <p className="text-slate-600 mt-1">
          Schedule public webinars for the homepage and the student webinar page. Decide whether each
          session is paid or free, and assign a host (lecturer or engineer). Course webinars created by
          lecturers stay inside their course materials and are not managed here.
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Schedule webinar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <WebinarFields form={form} setForm={setForm} hosts={hosts} />
          <Button
            onClick={() => void handleCreate()}
            disabled={saving}
            className="w-full bg-[var(--brand-navy)] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create webinar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {webinars.map((w) => (
          <Card key={w.id}>
            <CardContent className="pt-4 flex flex-wrap justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                {w.thumbnail_url ? (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    <Image src={w.thumbnail_url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{w.title}</p>
                  <p className="text-sm text-slate-600">{w.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={w.is_paid ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {w.is_paid ? `Paid · ${Number(w.price ?? 0).toLocaleString()} RWF` : 'Free'}
                    </Badge>
                    {w.host_name ? (
                      <span className="text-xs text-slate-600">
                        Host: {w.host_name}
                        {w.host_role ? ` (${w.host_role})` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Unassigned host</span>
                    )}
                  </div>
                  {w.scheduled_at ? (
                    <p className="text-xs text-slate-500 mt-1">{formatPlatformDateTime(w.scheduled_at)}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={w.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {w.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError('')
                    setEditing(w)
                    setEditForm(formFromWebinar(w))
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => void togglePublish(w)}>
                  {w.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleDelete(w.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit webinar</DialogTitle>
          </DialogHeader>
          <WebinarFields form={editForm} setForm={setEditForm} hosts={hosts} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[var(--brand-navy)] text-white"
              disabled={saving}
              onClick={() => void handleUpdate()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
