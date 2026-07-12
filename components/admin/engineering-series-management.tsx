'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { slugifySeriesTitle, type EngineeringArticleSeries } from '@/lib/engineering/series'
import { Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react'

const empty = {
  title: '',
  slug: '',
  description: '',
  cover_image_url: '',
  status: 'published',
  sort_order: 0,
}

export default function EngineeringSeriesManagement() {
  const [series, setSeries] = useState<EngineeringArticleSeries[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/engineering-series')
    const data = await res.json()
    setSeries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingId
        ? `/api/admin/engineering-series/${editingId}`
        : '/api/admin/engineering-series'
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
    if (!confirm('Delete this series?')) return
    await fetch(`/api/admin/engineering-series/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <p className="text-slate-600">Loading series…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Article series</h1>
        <p className="text-slate-600 mt-1">Group articles into collections like &quot;PLC Week 1–4&quot;.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? 'Edit series' : 'New series'}</CardTitle></CardHeader>
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
                  slug: f.slug || slugifySeriesTitle(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <ImageUploadField
            label="Cover image"
            value={form.cover_image_url}
            onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
            folder="engineering"
          />
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving} className="bg-[#1e3a5f]">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={() => { setEditingId(null); setForm(empty) }}>Cancel</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {series.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">/engineering/series/{item.slug}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{item.status}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/engineering/series/${item.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(item.id)
                    setForm({
                      title: item.title,
                      slug: item.slug,
                      description: item.description ?? '',
                      cover_image_url: item.cover_image_url ?? '',
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
