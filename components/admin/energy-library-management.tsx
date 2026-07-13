'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import {
  LIBRARY_CULTURE_TYPES,
  LIBRARY_GALLERY_TYPES,
  LIBRARY_PILLARS,
  libraryStatusBadgeClass,
  libraryStatusLabel,
  pillarLabel,
  slugifyLibraryTitle,
  type EnergyLibraryItem,
  type LibraryPillar,
} from '@/lib/library/items'
import { LIBRARY_LANGUAGES } from '@/lib/library/urls'
import { LIBRARY_TERMS_LABEL } from '@/lib/library/terms'
import { Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react'

const empty = {
  title: '',
  slug: '',
  description: '',
  pillar: 'gallery' as LibraryPillar,
  culture_type: '',
  gallery_type: 'photo',
  project_team: '',
  project_year: '',
  tech_stack: '',
  body: '',
  cover_image_url: '',
  file_url: '',
  gallery_images: [] as string[],
  author_name: '',
  language: 'rw',
  status: 'published',
  sort_order: 0,
  is_featured: false,
  price_rwf: 0,
  terms_accepted: false,
}

export default function EnergyLibraryManagement() {
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<EnergyLibraryItem[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/energy-library')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const uploadFile = async (file: File, folder: 'energy-library' | 'energy-library-docs') => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  const uploadPdf = async (file: File) => {
    const url = await uploadFile(file, 'energy-library-docs')
    if (url) setForm((f) => ({ ...f, file_url: url }))
  }

  const uploadGalleryImage = async (file: File) => {
    const url = await uploadFile(file, 'energy-library')
    if (url) {
      setForm((f) => ({
        ...f,
        gallery_images: [...f.gallery_images, url],
        cover_image_url: f.cover_image_url || url,
      }))
    }
  }

  const resetForm = () => {
    setForm(empty)
    setEditingId(null)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/energy-library/${editingId}` : '/api/admin/energy-library'
      const payload = form
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this library item?')) return
    await fetch(`/api/admin/energy-library/${id}`, { method: 'DELETE' })
    await load()
  }

  const togglePublish = async (item: EnergyLibraryItem) => {
    setError('')
    const nextStatus =
      item.status === 'published'
        ? 'archived'
        : item.status === 'pending_review'
          ? 'published'
          : 'published'

    const res = await fetch(`/api/admin/energy-library/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Status update failed')
      return
    }
    await load()
  }

  const startEdit = (item: EnergyLibraryItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description ?? '',
      pillar: item.pillar,
      culture_type: item.culture_type ?? '',
      gallery_type: item.gallery_type ?? 'photo',
      project_team: item.project_team ?? '',
      project_year: item.project_year ? String(item.project_year) : '',
      tech_stack: item.tech_stack.join(', '),
      body: item.body ?? '',
      cover_image_url: item.cover_image_url ?? '',
      file_url: item.file_url ?? '',
      gallery_images: item.gallery_images,
      author_name: item.author_name ?? '',
      language: item.language,
      status: item.status,
      sort_order: item.sort_order,
      is_featured: item.is_featured,
      price_rwf: item.price_rwf ?? 0,
      terms_accepted: Boolean(item.terms_accepted_at),
    })
  }

  if (loading) return <p className="text-slate-600">Loading Energy Library…</p>

  const pendingCount = items.filter((item) => item.status === 'pending_review').length
  const pendingItems = items.filter((item) => item.status === 'pending_review')
  const otherItems = items.filter((item) => item.status !== 'pending_review')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Energy Library</h1>
        <p className="text-slate-600 mt-1">
          Manage gallery, books, and culture on{' '}
          <Link href="/library" className="text-[var(--brand-navy)] underline" target="_blank">
            /library
          </Link>
          . Public visitors can browse without logging in.
        </p>
      </div>

      {pendingCount > 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 text-sm text-blue-950">
            <strong>{pendingCount}</strong> submission{pendingCount === 1 ? '' : 's'} from lecturers
            and students awaiting your review. Click <strong>Approve &amp; publish</strong> on each
            card below.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit item' : 'New library item'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.pillar}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pillar: e.target.value as LibraryPillar,
                    culture_type: e.target.value === 'culture' ? f.culture_type : '',
                  }))
                }
              >
                {LIBRARY_PILLARS.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {form.pillar === 'gallery' ? (
            <div className="space-y-2">
              <Label>Gallery type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.gallery_type}
                onChange={(e) => setForm((f) => ({ ...f, gallery_type: e.target.value }))}
              >
                {LIBRARY_GALLERY_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Engineering projects are admin-uploaded showcases in the public Gallery.
              </p>
            </div>
          ) : null}

          {form.pillar === 'culture' ? (
            <div className="space-y-2">
              <Label>Culture type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.culture_type}
                onChange={(e) => setForm((f) => ({ ...f, culture_type: e.target.value }))}
              >
                <option value="">Select type</option>
                {LIBRARY_CULTURE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.slug || slugifyLibraryTitle(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {form.pillar === 'gallery' && form.gallery_type === 'engineering_project' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project team</Label>
                <Input
                  value={form.project_team}
                  onChange={(e) => setForm((f) => ({ ...f, project_team: e.target.value }))}
                  placeholder="e.g. Solar capstone team 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Project year</Label>
                <Input
                  type="number"
                  value={form.project_year}
                  onChange={(e) => setForm((f) => ({ ...f, project_year: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Technologies (comma-separated)</Label>
                <Input
                  value={form.tech_stack}
                  onChange={(e) => setForm((f) => ({ ...f, tech_stack: e.target.value }))}
                  placeholder="PVsyst, Arduino, SCADA"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Project write-up</Label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Problem, approach, results, and lessons learned."
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Author name (optional)</Label>
            <Input
              value={form.author_name}
              onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
            />
          </div>

          <ImageUploadField
            label="Cover image"
            value={form.cover_image_url}
            onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
            folder="energy-library"
          />

          {form.pillar === 'gallery' ? (
            <div className="space-y-3">
              <Label>Gallery images</Label>
              <Input
                ref={galleryFileRef}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadGalleryImage(file)
                }}
              />
              {form.gallery_images.length > 0 ? (
                <ul className="space-y-2">
                  {form.gallery_images.map((url, index) => (
                    <li key={`${url}-${index}`} className="flex items-center gap-2 text-sm">
                      <span className="truncate flex-1 text-slate-600">{url}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            gallery_images: f.gallery_images.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Upload one or more images for the gallery.</p>
              )}
            </div>
          ) : null}

          {form.pillar === 'books' ? (
            <div className="space-y-2">
              <Label>Book PDF</Label>
              <Input
                value={form.file_url}
                onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                placeholder="URL or upload below"
              />
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
          ) : null}

          {(form.pillar === 'culture' || form.body) ? (
            <div className="space-y-2">
              <Label>Text content (optional)</Label>
              <Textarea
                rows={8}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Story, poem, or prose for culture items"
              />
            </div>
          ) : null}

          {(form.pillar === 'books' || form.pillar === 'culture') ? (
            <div className="space-y-2">
              <Label>Price (RWF)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={form.price_rwf}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price_rwf: Math.max(0, Number(e.target.value) || 0) }))
                }
                placeholder="0 = free access"
              />
              <p className="text-xs text-slate-500">
                Set a price for paid books or culture items. Leave at 0 for free access.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Language</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            >
              {LIBRARY_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            <span>Feature on homepage reading picks and library highlights</span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.terms_accepted}
              onChange={(e) => setForm((f) => ({ ...f, terms_accepted: e.target.checked }))}
            />
            <span>
              {LIBRARY_TERMS_LABEL}{' '}
              <Link href="/terms" className="text-[var(--brand-navy)] underline" target="_blank">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[var(--brand-navy)] underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save()} disabled={saving || uploading} className="bg-[#1e3a5f]">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {pendingItems.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Pending lecturer submissions</h2>
            {pendingItems.map((item) => (
              <Card key={item.id} className="border-blue-200">
                <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {pillarLabel(item.pillar)}
                      {item.author_name ? ` · ${item.author_name}` : ''}
                      {item.uploader_role ? ` · submitted by ${item.uploader_role}` : ''}
                      {item.is_featured ? ' · Featured' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className={libraryStatusBadgeClass(item.status)}>
                      {libraryStatusLabel(item.status)}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-[var(--brand-navy)]"
                      onClick={() => void togglePublish(item)}
                    >
                      Approve & publish
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void remove(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : null}

        {otherItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {pillarLabel(item.pillar)} · {libraryStatusLabel(item.status)} · {item.view_count} views
                  {item.author_name ? ` · ${item.author_name}` : ''}
                  {item.is_featured ? ' · Featured' : ''}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="outline" className={libraryStatusBadgeClass(item.status)}>
                  {libraryStatusLabel(item.status)}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void togglePublish(item)}
                >
                  {item.status === 'published' ? 'Archive' : 'Publish'}
                </Button>
                {item.status === 'published' ? (
                  <Link href={`/library/${item.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => void remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No library items yet. Create your first gallery or book above.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
