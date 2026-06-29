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
import { Edit2, Plus, Star, Trash2 } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  message: string
  image_url: string | null
  is_featured: boolean
  status: string
  type?: string
  created_at: string
}

const emptyForm = {
  title: '',
  message: '',
  image_url: '',
  is_featured: false,
  status: 'published',
  type: 'news',
}

export default function AnnouncementManagementTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          image_url: form.image_url || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')

      setForm(emptyForm)
      setIsCreateOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item: Announcement) => {
    setEditing(item)
    setEditForm({
      title: item.title,
      message: item.message,
      image_url: item.image_url || '',
      is_featured: item.is_featured,
      status: item.status || 'published',
      type: item.type || 'news',
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/announcements/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          image_url: editForm.image_url || null,
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

  const toggleFeatured = async (item: Announcement) => {
    await fetch(`/api/admin/announcements/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !item.is_featured }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    load()
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading announcements...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">Share news and updates with images on the homepage.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#1e3a5f]">
          <Plus className="w-4 h-4 mr-2" />
          Create announcement
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm form={form} setForm={setForm} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#1e3a5f]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden border-l-4 border-l-[#1e3a5f]">
              {announcement.image_url ? (
                <div className="relative h-40 w-full">
                  <Image
                    src={announcement.image_url}
                    alt={announcement.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-32 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{announcement.title}</h4>
                      {announcement.is_featured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(announcement.created_at).toLocaleDateString()} · {announcement.status}
                    </p>
                  </div>
                  {announcement.is_featured ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">Featured</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{announcement.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleFeatured(announcement)}>
                    {announcement.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(announcement)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(announcement.id)}
                  >
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
            <DialogTitle>Edit announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm form={editForm} setForm={setEditForm} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-[#1e3a5f]">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnnouncementForm({
  form,
  setForm,
}: {
  form: typeof emptyForm
  setForm: (value: typeof emptyForm) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          className="mt-1"
          placeholder="e.g., New course launched"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea
          className="mt-1"
          placeholder="Announcement content"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4}
        />
      </div>
      <ImageUploadField
        label="Announcement image"
        folder="announcements"
        value={form.image_url}
        onChange={(url) => setForm({ ...form, image_url: url })}
      />
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="training">Training</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={form.is_featured}
          onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="featured" className="m-0">Feature on homepage</Label>
      </div>
    </div>
  )
}
