'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, Lock } from 'lucide-react'
import type { SupportAccessSummary } from '@/lib/support/types'

type Discussion = {
  id: string
  title: string
  body: string
  topic: string
  reply_count: number
  created_at: string
  author?: { first_name?: string; last_name?: string; email?: string }
}

function authorName(author?: Discussion['author']) {
  if (!author) return 'Engineer'
  const n = [author.first_name, author.last_name].filter(Boolean).join(' ')
  return n || author.email || 'Engineer'
}

export function EngineerCommunityPanel({ access }: { access: SupportAccessSummary | null }) {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [replyBody, setReplyBody] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/engineer/community')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscussions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadThread = async (id: string) => {
    setSelectedId(id)
    const res = await fetch(`/api/engineer/community/${id}`)
    const data = await res.json()
    if (res.ok) setReplies(data.replies ?? [])
  }

  const createDiscussion = async () => {
    setError('')
    const res = await fetch('/api/engineer/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ title, body }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to post')
      return
    }
    setTitle('')
    setBody('')
    setShowForm(false)
    load()
  }

  const postReply = async () => {
    if (!selectedId || !replyBody.trim()) return
    const res = await fetch(`/api/engineer/community/${selectedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ body: replyBody }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to reply')
      return
    }
    setReplyBody('')
    loadThread(selectedId)
    load()
  }

  const canRead = access?.canReadCommunity && access?.hasActiveSubscription
  const canPost = access?.canPostCommunity
  const canReply = access?.canReplyCommunity

  if (!canRead) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-8 text-center space-y-3">
          <Lock className="h-8 w-8 mx-auto text-amber-700" />
          <p className="text-slate-800">
            Activate the free <strong>Community</strong> plan or a paid subscription to join discussions.
          </p>
          <Button asChild>
            <Link href="/engineering-support">View support plans</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Engineer community</h2>
          <p className="text-sm text-slate-600">
            Discuss PLC, electrical, and embedded topics with peers.
            {access?.planTier === 'free' ? ' Free plan: read & reply. Paid plans: start new topics.' : ''}
          </p>
        </div>
        {canPost ? (
          <Button onClick={() => setShowForm((v) => !v)} className="bg-primary">
            <Plus className="h-4 w-4 mr-1" /> New discussion
          </Button>
        ) : (
          <Badge variant="outline" className="text-amber-800 border-amber-300">
            Upgrade to start topics
          </Badge>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showForm && canPost ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Start a discussion</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Details</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button onClick={createDiscussion} disabled={!title.trim() || !body.trim()}>
              Post discussion
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading discussions…</p>
          ) : discussions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No discussions yet. Be the first!</CardContent></Card>
          ) : (
            discussions.map((d) => (
              <Card
                key={d.id}
                className={`cursor-pointer transition hover:shadow-md ${selectedId === d.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => loadThread(d.id)}
              >
                <CardContent className="py-4">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-slate-900">{d.title}</p>
                    <Badge variant="outline" className="shrink-0">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {d.reply_count}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{d.body}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {authorName(d.author)} · {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="min-h-[280px]">
          <CardHeader>
            <CardTitle className="text-base">Thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Select a discussion to read replies.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No replies yet.</p>
                  ) : (
                    replies.map((r) => (
                      <div key={r.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium text-slate-900">{authorName(r.author)}</p>
                        <p className="text-slate-700 mt-1 whitespace-pre-wrap">{r.body}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
                {canReply ? (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                    />
                    <Button size="sm" onClick={postReply} disabled={!replyBody.trim()}>
                      Reply
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">Upgrade to reply in threads.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
