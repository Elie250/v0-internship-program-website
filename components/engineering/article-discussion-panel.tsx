'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Lock } from 'lucide-react'
import type { SupportAccessSummary } from '@/lib/support/types'

type Reply = {
  id: string
  body: string
  created_at: string
  author?: { first_name?: string; last_name?: string; email?: string }
}

function authorName(author?: Reply['author']) {
  const n = [author?.first_name, author?.last_name].filter(Boolean).join(' ')
  return n || author?.email || 'Member'
}

export function ArticleDiscussionPanel({
  slug,
  access,
}: {
  slug: string
  access: SupportAccessSummary | null
}) {
  const [discussionId, setDiscussionId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyBody, setReplyBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const canRead = access?.canReadCommunity && access?.hasActiveSubscription
  const canReply = access?.canReplyCommunity && access?.hasActiveSubscription
  const canStart = access?.canPostCommunity && access?.hasActiveSubscription

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/engineering/articles/${slug}/discussion`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscussionId(data.discussion?.id ?? null)
      setReplies(Array.isArray(data.replies) ? data.replies : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discussion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [slug])

  const startDiscussion = async () => {
    setPosting(true)
    setError('')
    try {
      const res = await fetch(`/api/engineering/articles/${slug}/discussion`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscussionId(data.discussionId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start discussion')
    } finally {
      setPosting(false)
    }
  }

  const postReply = async () => {
    if (!discussionId || !replyBody.trim()) return
    setPosting(true)
    setError('')
    try {
      const res = await fetch(`/api/engineer/community/${discussionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body: replyBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReplyBody('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading discussion…</p>
  }

  if (!canRead) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Lock className="h-4 w-4" />
          Subscriber discussion
        </div>
        <p className="text-sm text-slate-600">
          Join the Engineering Support community to discuss this article with other practitioners.
        </p>
        <Button asChild className="bg-[var(--brand-navy)] text-white">
          <Link href="/engineering-support">Get community access</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[var(--brand-navy)]" />
        <h2 className="font-semibold text-slate-900">Discuss this article</h2>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!discussionId ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">No thread yet. Be the first to open the conversation.</p>
          {canStart ? (
            <Button onClick={() => void startDiscussion()} disabled={posting}>
              {posting ? 'Starting…' : 'Start discussion'}
            </Button>
          ) : (
            <p className="text-sm text-slate-500">Paid plans can start discussions.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {replies.length === 0 ? (
              <p className="text-sm text-slate-500">No replies yet.</p>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">
                    {authorName(reply.author)} · {new Date(reply.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-line">{reply.body}</p>
                </div>
              ))
            )}
          </div>
          {canReply ? (
            <div className="space-y-2">
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Add your reply…"
                rows={3}
              />
              <Button onClick={() => void postReply()} disabled={posting || !replyBody.trim()}>
                {posting ? 'Posting…' : 'Post reply'}
              </Button>
            </div>
          ) : null}
          <Link
            href={`/subscriber?tab=community`}
            className="text-sm text-[var(--brand-navy)] underline font-medium"
          >
            Open full community hub →
          </Link>
        </div>
      )}
    </section>
  )
}
