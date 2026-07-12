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
import type { EngineeringArticleSeries } from '@/lib/engineering/series'
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
  series_id: string
  series_sort_order: string
  scheduled_publish_at: string
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
  series_id: '',
  series_sort_order: '',
  scheduled_publish_at: '',
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
    series_id: article.series_id ?? '',
    series_sort_order: article.series_sort_order != null ? String(article.series_sort_order) : '',
    scheduled_publish_at: toDatetimeLocal(article.scheduled_publish_at),
  }
}

function ArticleFormFields({
  form,
  setForm,
  series,
}: {
  form: ArticleForm
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>
  series: EngineeringArticleSeries[]
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
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Series (optional)</Label>
          <Select
            value={form.series_id || 'none'}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, series_id: value === 'none' ? '' : value }))
            }
          >
            <SelectTrigger><SelectValue placeholder="No series" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No series</SelectItem>
              {series.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Part number in series</Label>
          <Input
            type="number"
            min={1}
            value={form.series_sort_order}
            onChange={(e) => setForm((f) => ({ ...f, series_sort_order: e.target.value }))}
            placeholder="1"
            disabled={!form.series_id}
          />
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
      <div className="space-y-2">
        <Label>Schedule publish (optional)</Label>
        <Input
          type="datetime-local"
          value={form.scheduled_publish_at}
          onChange={(e) => setForm((f) => ({ ...f, scheduled_publish_at: e.target.value }))}
        />
        <p className="text-xs text-slate-500">
          Future dates keep the article as draft until the scheduled time. Leave empty to publish
          immediately when status is Published.
        </p>
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
    series_id: form.series_id || null,
    series_sort_order: form.series_sort_order ? Number(form.series_sort_order) : null,
    scheduled_publish_at: form.scheduled_publish_at
      ? new Date(form.scheduled_publish_at).toISOString()
      : null,
  }
}

export default function EngineeringArticlesManagement() {
  const [articles, setArticles] = useState<EngineeringArticle[]>([])
  const [series, setSeries] = useState<EngineeringArticleSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<EngineeringArticle | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [editForm, setEditForm] = useState<ArticleForm>(emptyForm)

  const load = async () => {
    const [articlesRes, seriesRes] = await Promise.all([
      fetch('/api/admin/engineering-articles'),
      fetch('/api/admin/engineering-series'),
    ])
    const data = await articlesRes.json()
    const seriesData = await seriesRes.json()
    setArticles(Array.isArray(data) ? data : [])
    setSeries(Array.isArray(seriesData) ? seriesData : [])
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
          <ArticleFormFields form={form} setForm={setForm} series={series} />
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
          <ArticleFormFields form={editForm} setForm={setEditForm} series={series} />
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
                      {article.view_count > 0 ? ` · ${article.view_count.toLocaleString()} views` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{article.status}</Badge>
                    <Badge variant="outline">{article.access_tier}</Badge>
                    {article.scheduled_publish_at &&
                    new Date(article.scheduled_publish_at).getTime() > Date.now() ? (
                      <Badge className="bg-violet-100 text-violet-900">
                        Scheduled {new Date(article.scheduled_publish_at).toLocaleString()}
                      </Badge>
                    ) : null}
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
