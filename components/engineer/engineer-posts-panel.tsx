'use client'

import { useCallback, useEffect, useState } from 'react'
import { Eye, PenLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProfilePostsSection } from '@/components/engineering/profile-posts-section'

type Post = {
  id: string
  title: string | null
  body: string
  createdAt: string
}

export function EngineerPostsPanel({
  isSignedIn = true,
}: {
  authorId?: string
  isSignedIn?: boolean
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/engineer/posts')
      if (!res.ok) return
      const data = await res.json()
      setPosts(
        (data.posts ?? []).map((p: Record<string, unknown>) => ({
          id: String(p.id),
          title: p.title != null ? String(p.title) : null,
          body: String(p.body ?? ''),
          createdAt: String(p.createdAt ?? p.created_at ?? ''),
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const handleCreate = async () => {
    const trimmedBody = body.trim()
    if (!trimmedBody || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/engineer/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null, body: trimmedBody }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not publish post')
        return
      }
      setTitle('')
      setBody('')
      await loadPosts()
    } catch {
      setError('Could not publish post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post? Comments will be removed too.')) return
    const res = await fetch(`/api/engineer/posts?id=${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    })
    if (res.ok) await loadPosts()
  }

  function formatWhen(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <PenLine className="h-5 w-5 text-[var(--brand-navy)]" />
            Public profile posts
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Share updates on your public author page. Anyone signed in can comment — no paid plan
            needed.
          </p>
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional title"
          maxLength={200}
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What would you like to share with the community?"
          rows={4}
          maxLength={8000}
          className="resize-y"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          onClick={() => void handleCreate()}
          disabled={submitting || !body.trim()}
          className="bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90"
        >
          {submitting ? 'Publishing…' : 'Publish to profile'}
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-slate-900">Your posts</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-slate-600 rounded-lg border border-dashed border-slate-200 p-4">
            No posts yet. Publish your first update above.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  {post.title ? (
                    <p className="font-medium text-slate-900">{post.title}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">{formatWhen(post.createdAt)}</p>
                  <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">
                    {post.body}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => void handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[var(--brand-navy)]" />
            <h3 className="font-medium text-slate-900">Public preview</h3>
          </div>
          <p className="text-sm text-slate-600">
            This is how others see your posts on your author page — no login required to read.
          </p>
          <ProfilePostsSection
            posts={posts.map((post) => ({
              id: post.id,
              title: post.title,
              body: post.body,
              createdAt: post.createdAt,
            }))}
            isSignedIn={isSignedIn}
          />
        </div>
      ) : null}
    </div>
  )
}
