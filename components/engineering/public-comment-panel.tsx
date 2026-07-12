'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Comment = {
  id: string
  authorName: string
  body: string
  createdAt: string
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function PublicCommentPanel({
  fetchUrl,
  postUrl,
  title = 'Comments',
  emptyLabel = 'No comments yet. Be the first to share your thoughts.',
  isSignedIn,
}: {
  fetchUrl: string
  postUrl: string
  title?: string
  emptyLabel?: string
  isSignedIn: boolean
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(fetchUrl)
      if (!res.ok) return
      const data = await res.json()
      setComments(
        (data.comments ?? []).map((c: Record<string, unknown>) => ({
          id: String(c.id),
          authorName: String(c.authorName ?? c.author_name ?? 'Member'),
          body: String(c.body ?? ''),
          createdAt: String(c.createdAt ?? c.created_at ?? ''),
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [fetchUrl])

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  const handleSubmit = async () => {
    const trimmed = body.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not post comment')
        return
      }
      const c = data.comment
      if (c) {
        setComments((prev) => [
          ...prev,
          {
            id: String(c.id),
            authorName: String(c.authorName ?? c.author_name ?? 'You'),
            body: String(c.body),
            createdAt: String(c.createdAt ?? c.created_at ?? new Date().toISOString()),
          },
        ])
      }
      setBody('')
    } catch {
      setError('Could not post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[var(--brand-navy)]" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">({comments.length})</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-slate-900 text-sm">{comment.authorName}</span>
                <span className="text-xs text-slate-500">{formatWhen(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {isSignedIn ? (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            maxLength={4000}
            className="resize-y min-h-[80px]"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={submitting || !body.trim()}
            className="bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90"
          >
            <Send className="h-4 w-4 mr-1.5" />
            {submitting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-600 pt-2 border-t border-slate-100">
          <Link href="/login" className="text-[var(--brand-navy)] font-medium underline">
            Sign in
          </Link>{' '}
          to join the conversation — free for all members, no paid plan required.
        </p>
      )}
    </section>
  )
}
