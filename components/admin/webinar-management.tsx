'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

type Webinar = {
  id: string
  title: string
  description: string | null
  scheduled_at: string | null
  meeting_link: string | null
  recording_url: string | null
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

const emptyForm = {
  title: '',
  description: '',
  scheduled_at: '',
  meeting_link: '',
  recording_url: '',
  status: 'draft',
  is_paid: false,
  price: '',
  host_user_id: '',
}

const UNASSIGNED = 'unassigned'

export default function WebinarManagement() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

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
    load()
    loadHosts()
  }, [])

  const handleCreate = async () => {
    await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        scheduled_at: form.scheduled_at || null,
        is_paid: form.is_paid,
        price: form.is_paid ? Number(form.price || 0) : 0,
        host_user_id: form.host_user_id || null,
      }),
    })
    setForm(emptyForm)
    load()
  }

  const togglePublish = async (w: Webinar) => {
    const status = w.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/webinars/${w.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete webinar?')) return
    await fetch(`/api/admin/webinars/${id}`, { method: 'DELETE' })
    load()
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

      <Card>
        <CardHeader><CardTitle>Schedule webinar</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Title</Label>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Date & time</Label>
            <Input type="datetime-local" className="mt-1" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Meeting link (Zoom/Meet)</Label>
            <Input className="mt-1" value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />
          </div>
          <div>
            <Label>Recording URL</Label>
            <Input className="mt-1" value={form.recording_url} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} />
          </div>
          <div>
            <Label>Access</Label>
            <Select
              value={form.is_paid ? 'paid' : 'free'}
              onValueChange={(v) => setForm({ ...form, is_paid: v === 'paid', price: v === 'paid' ? form.price : '' })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Assign host (lecturer / engineer)</Label>
            <Select
              value={form.host_user_id || UNASSIGNED}
              onValueChange={(v) => setForm({ ...form, host_user_id: v === UNASSIGNED ? '' : v })}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
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
          <Button onClick={handleCreate} className="md:col-span-2 bg-[var(--brand-navy)] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create webinar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {webinars.map((w) => (
          <Card key={w.id}>
            <CardContent className="pt-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{w.title}</p>
                <p className="text-sm text-slate-600">{w.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={w.is_paid ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {w.is_paid ? `Paid · ${Number(w.price ?? 0).toLocaleString()} RWF` : 'Free'}
                  </Badge>
                  {w.host_name ? (
                    <span className="text-xs text-slate-600">Host: {w.host_name}{w.host_role ? ` (${w.host_role})` : ''}</span>
                  ) : (
                    <span className="text-xs text-slate-500">Unassigned host</span>
                  )}
                </div>
                {w.scheduled_at ? (
                  <p className="text-xs text-slate-500 mt-1">{new Date(w.scheduled_at).toLocaleString()}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={w.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {w.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => togglePublish(w)}>
                  {w.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(w.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
