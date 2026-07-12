'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { slugifyArticleTitle, type EngineeringArticle } from '@/lib/engineering/articles'
import { Plus } from 'lucide-react'

type DraftForm = {
  title: string
  slug: string
  excerpt: string
  body: string
  tags: string
  access_tier: 'free' | 'pro' | 'premium'
}

const emptyDraft: DraftForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  tags: 'field-fix',
  access_tier: 'free',
}

export function EngineerFieldNotesPanel() {
  const [articles, setArticles] = useState<EngineeringArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<DraftForm>(emptyDraft)

  const load = async () => {
    const res = await fetch('/api/engineer/articles', { credentials: 'same-origin' })
    const data = await res.json()
    setArticles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const submitDraft = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/engineer/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || slugifyArticleTitle(form.title),
          excerpt: form.excerpt,
          body: form.body,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          access_tier: form.access_tier,
          status: 'draft',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save draft')
      setMessage('Draft submitted — an admin will review and publish it.')
      setForm(emptyDraft)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading your articles…</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Field Notes authoring</h3>
          <p className="text-sm text-slate-600">
            Write practical engineering articles. Drafts are reviewed before publishing on{' '}
            <Link href="/engineering" className="text-[var(--brand-navy)] underline" target="_blank">
              Field Notes
            </Link>
            .
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          New draft
        </Button>
      </div>

      {error ? <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{message}</p>
      ) : null}

      {showForm ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
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
              <Label>Excerpt</Label>
              <Textarea
                className="min-h-[70px]"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Article body</Label>
              <Textarea
                className="min-h-[180px]"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Suggested tier</Label>
                <Select
                  value={form.access_tier}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, access_tier: value as DraftForm['access_tier'] }))
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
            </div>
            <Button onClick={() => void submitDraft()} disabled={saving || !form.title || !form.body}>
              {saving ? 'Saving…' : 'Submit draft'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            No drafts yet. Share a field fix, wiring tip, or troubleshooting guide.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{article.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Updated {new Date(article.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{article.status}</Badge>
                  {article.status === 'published' ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/engineering/${article.slug}`} target="_blank">View live</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
