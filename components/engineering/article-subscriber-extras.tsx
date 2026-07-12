'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArticleDiscussionPanel } from '@/components/engineering/article-discussion-panel'
import { RelatedToolsPanel } from '@/components/engineering/related-tools-panel'
import type { SupportAccessSummary } from '@/lib/support/types'

export function ArticleSubscriberExtras({
  slug,
  tags,
  authorId,
  authorName,
}: {
  slug: string
  tags: string[]
  authorId: string | null
  authorName: string | null
}) {
  const [access, setAccess] = useState<SupportAccessSummary | null>(null)

  useEffect(() => {
    fetch('/api/support/subscribe', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAccess(data))
      .catch(() => setAccess(null))
  }, [])

  return (
    <div className="space-y-8">
      {authorId && authorName ? (
        <p className="text-sm text-slate-600">
          Written by{' '}
          <Link
            href={`/engineering/authors/${authorId}`}
            className="font-medium text-[var(--brand-navy)] underline"
          >
            {authorName}
          </Link>
        </p>
      ) : null}
      <RelatedToolsPanel tags={tags} />
      <ArticleDiscussionPanel slug={slug} access={access} />
    </div>
  )
}
