'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import type { EngineeringArticle } from '@/lib/engineering/articles'

type EditorialSummary = {
  drafts: EngineeringArticle[]
  scheduled: EngineeringArticle[]
  recentPublished: EngineeringArticle[]
  activeSubscribers: number
}

function formatWhen(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ArticleRow({ article, meta }: { article: EngineeringArticle; meta?: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 items-start py-2 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{article.title}</p>
        <p className="text-xs text-slate-500">
          {article.author_name || 'Unknown'} · {meta ?? formatWhen(article.updated_at)}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <Badge variant="outline">{article.status}</Badge>
        {article.status === 'published' ? (
          <Link
            href={`/engineering/${article.slug}`}
            target="_blank"
            className="text-xs text-[var(--brand-navy)] underline inline-flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function EngineeringEditorialManagement() {
  const [summary, setSummary] = useState<EditorialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/admin/engineering-editorial')
      .then((res) => res.json())
      .then((data) => {
        setSummary(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-slate-600">Loading editorial queue…</p>

  const data = summary ?? {
    drafts: [],
    scheduled: [],
    recentPublished: [],
    activeSubscribers: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Field Notes editorial</h1>
        <p className="text-slate-600 mt-1">
          Draft queue, scheduled posts, and digest reach.{' '}
          <Link href="/admin/dashboard/engineering-articles" className="text-[var(--brand-navy)] underline">
            Manage articles
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Digest subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">
            {data.activeSubscribers.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">Active Weekly Circuit subscribers</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Drafts ({data.drafts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.drafts.length === 0 ? (
              <p className="text-sm text-slate-500">No pending drafts.</p>
            ) : (
              data.drafts.map((article) => (
                <ArticleRow key={article.id} article={article} meta={`Updated ${formatWhen(article.updated_at)}`} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scheduled ({data.scheduled.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.scheduled.length === 0 ? (
              <p className="text-sm text-slate-500">No scheduled posts.</p>
            ) : (
              data.scheduled.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  meta={`Publishes ${formatWhen(article.scheduled_publish_at)}`}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recently published ({data.recentPublished.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPublished.length === 0 ? (
              <p className="text-sm text-slate-500">No published articles yet.</p>
            ) : (
              data.recentPublished.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  meta={`Published ${formatWhen(article.published_at)}`}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
