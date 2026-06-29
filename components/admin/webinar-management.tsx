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
}

const emptyForm = {
  title: '',
  description: '',
  scheduled_at: '',
  meeting_link: '',
  recording_url: '',
  status: 'draft',
}

export default function WebinarManagement() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/admin/webinars')
    const data = await res.json()
    setWebinars(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        scheduled_at: form.scheduled_at || null,
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

  if (loading) return <p className="text-muted-foreground">Loading webinars…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webinars</h1>
        <p className="text-muted-foreground mt-1">
          Published webinars appear for students after course payment is approved.
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
          <Button onClick={handleCreate} className="md:col-span-2 bg-[#1e3a5f]">
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
                <p className="font-semibold">{w.title}</p>
                <p className="text-sm text-muted-foreground">{w.description}</p>
                {w.scheduled_at ? (
                  <p className="text-xs text-muted-foreground mt-1">{new Date(w.scheduled_at).toLocaleString()}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={w.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}>
                  {w.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => togglePublish(w)}>
                  {w.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(w.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
