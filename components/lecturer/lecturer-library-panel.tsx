'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  LIBRARY_CULTURE_TYPES,
  LIBRARY_PILLARS,
  libraryStatusBadgeClass,
  libraryStatusLabel,
  pillarLabel,
  slugifyLibraryTitle,
  type EnergyLibraryItem,
  type LibraryPillar,
} from '@/lib/library/items'
import { LIBRARY_TERMS_LABEL } from '@/lib/library/terms'
import { BookOpen, Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react'

const LECTURER_PILLARS = LIBRARY_PILLARS.filter((pillar) => pillar.id !== 'gallery')

const empty = {
  title: '',
  slug: '',
  description: '',
  pillar: 'books' as LibraryPillar,
  culture_type: '',
  body: '',
  cover_image_url: '',
  file_url: '',
  author_name: '',
  language: 'rw',
  terms_accepted: false,
}

export function LecturerLibraryPanel() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [userName, setUserName] = useState('')
  const [items, setItems] = useState<EnergyLibraryItem[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const res = await fetch('/api/lecturer/library', { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load submissions')
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser()
      if (
        !currentUser ||
        (currentUser.role !== 'lecturer' && currentUser.role !== 'instructor')
      ) {
        router.push('/auth/login?role=lecturer')
        return
      }

      const name = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim()
      setUserName(name || currentUser.email)
      setForm((f) => ({
        ...f,
        author_name: name || f.author_name,
      }))

      try {
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [router])

  const uploadFile = async (file: File, kind: 'cover' | 'pdf') => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      const res = await fetch('/api/lecturer/library/upload', {
        method: 'POST',
        body,
        credentials: 'same-origin',
      })
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

  const resetForm = () => {
    setForm((f) => ({
      ...empty,
      author_name: f.author_name,
    }))
    setEditingId(null)
    setSuccess('')
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const url = editingId ? `/api/lecturer/library/${editingId}` : '/api/lecturer/library'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submit failed')
      resetForm()
      await load()
      setSuccess(
        editingId
          ? 'Submission updated. It will be reviewed again by an admin.'
          : 'Book submitted for admin review. You will see it on the public library once approved.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    setError('')
    const res = await fetch(`/api/lecturer/library/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Delete failed')
      return
    }
    if (editingId === id) resetForm()
    await load()
  }

  const startEdit = (item: EnergyLibraryItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description ?? '',
      pillar: item.pillar === 'gallery' ? 'books' : item.pillar,
      culture_type: item.culture_type ?? '',
      body: item.body ?? '',
      cover_image_url: item.cover_image_url ?? '',
      file_url: item.file_url ?? '',
      author_name: item.author_name ?? '',
      language: item.language,
      terms_accepted: Boolean(item.terms_accepted_at),
    })
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <LecturerPortalShell userName={userName || 'Lecturer'}>
        <p className="text-slate-600">Loading Energy Library…</p>
      </LecturerPortalShell>
    )
  }

  return (
    <LecturerPortalShell userName={userName}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Energy Library</h1>
          <p className="text-slate-600 mt-1">
            Submit books for the public{' '}
            <Link href="/library" className="text-[var(--brand-navy)] underline" target="_blank">
              Energy Library
            </Link>
            . Submissions are reviewed by an admin before they go live.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit submission' : 'Submit a book'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{success}</p> : null}

            <div className="space-y-2">
              <Label>Type</Label>
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
                {LECTURER_PILLARS.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.label}
                  </option>
                ))}
              </select>
            </div>

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
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short summary for library visitors"
              />
            </div>

            <div className="space-y-2">
              <Label>Author name</Label>
              <Input
                value={form.author_name}
                onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover image (optional)</Label>
              {form.cover_image_url ? (
                <div className="relative h-24 w-24 rounded-md border overflow-hidden bg-muted">
                  <Image src={form.cover_image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <Input
                ref={coverRef}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await uploadFile(file, 'cover')
                  if (url) setForm((f) => ({ ...f, cover_image_url: url }))
                }}
              />
            </div>

            {form.pillar === 'books' ? (
              <div className="space-y-2">
                <Label>Book PDF</Label>
                <Input
                  value={form.file_url}
                  readOnly
                  placeholder="Upload your PDF below"
                />
                <Input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = await uploadFile(file, 'pdf')
                    if (url) setForm((f) => ({ ...f, file_url: url }))
                  }}
                />
              </div>
            ) : null}

            {form.pillar === 'culture' ? (
              <div className="space-y-2">
                <Label>Text content</Label>
                <Textarea
                  rows={8}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Inkuru, ibisigo, imivugo, or other creative writing"
                />
              </div>
            ) : null}

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
              <Button
                onClick={() => void save()}
                disabled={saving || uploading || !form.terms_accepted}
                className="bg-[var(--brand-navy)]"
              >
                {saving ? 'Submitting…' : editingId ? 'Update submission' : 'Submit for review'}
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
          <h2 className="text-lg font-semibold text-slate-900">Your submissions</h2>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
                <div className="flex items-start gap-3 min-w-0">
                  <BookOpen className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {pillarLabel(item.pillar)}
                      {item.author_name ? ` · ${item.author_name}` : ''}
                    </p>
                    {item.status === 'pending_review' ? (
                      <p className="text-xs text-blue-800 mt-1">Waiting for admin approval</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className={libraryStatusBadgeClass(item.status)}>
                    {libraryStatusLabel(item.status)}
                  </Badge>
                  {item.status === 'published' ? (
                    <Link href={`/library/${item.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : null}
                  {item.status === 'pending_review' || item.status === 'draft' ? (
                    <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {item.status !== 'published' ? (
                    <Button variant="outline" size="sm" onClick={() => void remove(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-600">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No submissions yet. Upload your first book above.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </LecturerPortalShell>
  )
}
