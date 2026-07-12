'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { ENGINEERING_ARTICLE_TAGS, slugifyArticleTitle, type EngineeringArticle } from '@/lib/engineering/articles'
import { Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react'

type ArticleForm = {
  title: string
  slug: string
  excerpt: string
  body: string
  cover_image_url: string
  tags: string
  access_tier: 'free' | 'pro' | 'premium'
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  author_name: string
}

const emptyForm: ArticleForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  cover_image_url: '',
  tags: '',
  access_tier: 'free',
  status: 'draft',
  is_featured: false,
  author_name: '',
}

function toForm(article: EngineeringArticle): ArticleForm {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    body: article.body,
    cover_image_url: article.cover_image_url ?? '',
    tags: article.tags.join(', '),
    access_tier: article.access_tier,
    status: article.status,
    is_featured: article.is_featured,
    author_name: article.author_name ?? '',
  }
}

function ArticleFormFields({
  form,
  setForm,
}: {
  form: ArticleForm
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              title: e.target.value,
              slug: f.slug || slugifyArticleTitle(e.target.value),
            }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="url-friendly-slug"
        />
      </div>
      <div className="space-y-2">
        <Label>Author display name</Label>
        <Input
          value={form.author_name}
          onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Access tier</Label>
          <Select
            value={form.access_tier}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, access_tier: value as ArticleForm['access_tier'] }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, status: value as ArticleForm['status'] }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Featured</Label>
          <Select
            value={form.is_featured ? 'yes' : 'no'}
            onValueChange={(value) => setForm((f) => ({ ...f, is_featured: value === 'yes' }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ImageUploadField
        label="Cover image"
        value={form.cover_image_url}
        onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
        folder="engineering"
      />
      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Textarea
          className="min-h-[80px]"
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Body</Label>
        <Textarea
          className="min-h-[220px] font-mono text-sm"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder={ENGINEERING_ARTICLE_TAGS.join(', ')}
        />
      </div>
    </div>
  )
}

function payloadFromForm(form: ArticleForm) {
  return {
    title: form.title,
    slug: form.slug || slugifyArticleTitle(form.title),
    excerpt: form.excerpt,
    body: form.body,
    cover_image_url: form.cover_image_url || null,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    access_tier: form.access_tier,
    status: form.status,
    is_featured: form.is_featured,
    author_name: form.author_name || null,
  }
}

export default function EngineeringArticlesManagement() {
  const [articles, setArticles] = useState<EngineeringArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<EngineeringArticle | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [editForm, setEditForm] = useState<ArticleForm>(emptyForm)

  const load = async () => {
    const res = await fetch('/api/admin/engineering-articles')
    const data = await res.json()
    setArticles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const createArticle = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/engineering-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFromForm(form)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setCreateOpen(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const updateArticle = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/engineering-articles/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFromForm(editForm)),
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

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return
    await fetch(`/api/admin/engineering-articles/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <p className="text-slate-600">Loading field notes…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Notes</h1>
          <p className="text-slate-600 mt-1">
            Publish engineering articles on{' '}
            <Link href="/engineering" className="text-[var(--brand-navy)] underline" target="_blank">
              /engineering
            </Link>
            .
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-[#1e3a5f]">
          <Plus className="w-4 h-4 mr-2" />
          New article
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create field note</DialogTitle>
          </DialogHeader>
          <ArticleFormFields form={form} setForm={setForm} />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void createArticle()} disabled={saving} className="bg-[#1e3a5f]">
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit field note</DialogTitle>
          </DialogHeader>
          <ArticleFormFields form={editForm} setForm={setEditForm} />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void updateArticle()} disabled={saving} className="bg-[#1e3a5f]">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            No articles yet. Create your first field note.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-slate-900">{article.title}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {article.author_name || 'Unknown author'} · /engineering/{article.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{article.status}</Badge>
                    <Badge variant="outline">{article.access_tier}</Badge>
                    {article.is_featured ? <Badge className="bg-amber-100 text-amber-900">Featured</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {article.status === 'published' ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/engineering/${article.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(article)
                    setEditForm(toForm(article))
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => void deleteArticle(article.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
