import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { tierBadgeLabel, type EngineeringArticlePublic } from '@/lib/engineering/articles'

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function FieldNotesArticleCard({ article }: { article: EngineeringArticlePublic }) {
  return (
    <Card className="border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/engineering/${article.slug}`} className="block no-underline hover:no-underline">
        {article.cover_image_url ? (
          <div className="relative h-44 w-full bg-slate-100">
            <Image
              src={article.cover_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs border-slate-300">
              {tierBadgeLabel(article.access_tier)}
            </Badge>
            {article.is_featured ? (
              <Badge className="bg-amber-100 text-amber-900 text-xs">Featured</Badge>
            ) : null}
            {article.bodyLocked ? (
              <Badge className="bg-slate-100 text-slate-700 text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Preview
              </Badge>
            ) : null}
          </div>
          <h2 className="text-lg font-semibold text-slate-900 leading-snug">{article.title}</h2>
          <p className="text-sm text-slate-600 line-clamp-3">
            {article.excerpt || article.body}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {article.author_name ? <span>{article.author_name}</span> : null}
            {article.published_at ? <span>· {formatDate(article.published_at)}</span> : null}
          </div>
          {article.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  )
}

export function FieldNotesArticleBody({ article }: { article: EngineeringArticlePublic }) {
  return (
    <article className="space-y-6">
      {article.cover_image_url ? (
        <div className="relative h-56 sm:h-72 rounded-xl overflow-hidden border border-slate-200">
          <Image
            src={article.cover_image_url}
            alt=""
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      ) : null}

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{tierBadgeLabel(article.access_tier)}</Badge>
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{article.title}</h1>
        <p className="text-sm text-slate-600">
          {article.author_name ? `${article.author_name}` : 'Energy & Logics'}
          {article.published_at ? ` · ${formatDate(article.published_at)}` : ''}
        </p>
        {article.excerpt ? <p className="text-lg text-slate-700">{article.excerpt}</p> : null}
      </header>

      <div className="prose prose-slate max-w-none">
        <div className="text-slate-800 leading-relaxed whitespace-pre-line">{article.body}</div>
      </div>

      {article.bodyLocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <Lock className="h-4 w-4" />
            Subscriber content
          </div>
          <p className="text-sm text-amber-900">{article.lockReason}</p>
          <Link
            href="/engineering-support"
            className="inline-flex text-sm font-semibold text-[var(--brand-navy)] underline"
          >
            View Engineering Support plans →
          </Link>
        </div>
      ) : null}
    </article>
  )
}
