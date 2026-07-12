'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { slugifyLeadMagnetTitle, type EngineeringLeadMagnet } from '@/lib/engineering/lead-magnets'
import { Edit2, Plus, Trash2 } from 'lucide-react'

const empty = {
  title: '',
  slug: '',
  description: '',
  file_url: '',
  status: 'published',
  sort_order: 0,
}

export default function EngineeringLeadMagnetsManagement() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<EngineeringLeadMagnet[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/engineering-lead-magnets')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const uploadPdf = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'engineering-docs')
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, file_url: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingId
        ? `/api/admin/engineering-lead-magnets/${editingId}`
        : '/api/admin/engineering-lead-magnets'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setForm(empty)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this lead magnet?')) return
    await fetch(`/api/admin/engineering-lead-magnets/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <p className="text-slate-600">Loading lead magnets…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lead magnet PDFs</h1>
        <p className="text-slate-600 mt-1">Free downloadable guides with email capture on /engineering.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? 'Edit PDF' : 'New PDF guide'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.slug || slugifyLeadMagnetTitle(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>PDF file</Label>
            <Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="URL or upload below" />
            <Input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadPdf(file)
              }}
            />
          </div>
          <Button onClick={() => void save()} disabled={saving || uploading} className="bg-[#1e3a5f]">
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.download_count} downloads</p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="outline">{item.status}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(item.id)
                    setForm({
                      title: item.title,
                      slug: item.slug,
                      description: item.description ?? '',
                      file_url: item.file_url,
                      status: item.status,
                      sort_order: item.sort_order,
                    })
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => void remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
