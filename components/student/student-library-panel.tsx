'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  cultureTypeLabel,
  LIBRARY_CULTURE_TYPES,
  libraryStatusBadgeClass,
  libraryStatusLabel,
  slugifyLibraryTitle,
  type EnergyLibraryItem,
  type LibraryCultureType,
} from '@/lib/library/items'
import { LIBRARY_TERMS_LABEL } from '@/lib/library/terms'
import { Edit2, ExternalLink, Plus, Sparkles, Trash2 } from 'lucide-react'

const empty = {
  title: '',
  slug: '',
  description: '',
  culture_type: '' as LibraryCultureType | '',
  body: '',
  cover_image_url: '',
  author_name: '',
  language: 'rw',
  terms_accepted: false,
}

export function StudentLibraryPanel() {
  const router = useRouter()
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
    const res = await fetch('/api/student/library', { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load submissions')
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser?.id) {
        router.push('/auth/login?role=student')
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

  const uploadCover = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/student/library/upload', {
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
    if (!form.culture_type) {
      setError('Select a culture type')
      return
    }
    if (!form.body.trim()) {
      setError('Write your story, poem, or creative piece')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const url = editingId ? `/api/student/library/${editingId}` : '/api/student/library'
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
          : 'Your writing was submitted! It will appear in the Energy Library once approved.'
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
    const res = await fetch(`/api/student/library/${id}`, {
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
      culture_type: item.culture_type ?? '',
      body: item.body ?? '',
      cover_image_url: item.cover_image_url ?? '',
      author_name: item.author_name ?? '',
      language: item.language,
      terms_accepted: Boolean(item.terms_accepted_at),
    })
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <StudentPortalShell userName={userName || 'Student'}>
        <p className="text-slate-600">Loading Energy Library…</p>
      </StudentPortalShell>
    )
  }

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Share your writing</h1>
          <p className="text-slate-600 mt-1">
            Submit Inkuru, ibisigo, imivugo, or creative arts to the public{' '}
            <Link href="/library?category=culture" className="text-[var(--brand-navy)] underline" target="_blank">
              Energy Library
            </Link>
            . Your piece will be reviewed before it goes live.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit submission' : 'New culture piece'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {success}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label>Culture type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.culture_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, culture_type: e.target.value as LibraryCultureType }))
                }
              >
                <option value="">Select type</option>
                {LIBRARY_CULTURE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

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
              <Label>Short description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="A one-line teaser for readers"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Your name</Label>
              <Input
                value={form.author_name}
                onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Your writing</Label>
              <Textarea
                rows={12}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Inkuru, ibisigo, imivugo, or other creative writing"
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
                  const url = await uploadCover(file)
                  if (url) setForm((f) => ({ ...f, cover_image_url: url }))
                }}
              />
            </div>

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
                  <Sparkles className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {cultureTypeLabel(item.culture_type) ?? 'Culture'}
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
                No submissions yet. Share your first Inkuru, ibisigo, or imivugo above.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </StudentPortalShell>
  )
}
