'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StarRatingDisplay } from '@/components/reviews/star-rating'
import {
  REVIEW_CONTEXT_LABELS,
  formatReviewDate,
  type ReviewContext,
  type ServiceReview,
} from '@/lib/reviews/types'
import { Check, Star, Trash2, X } from 'lucide-react'

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<ServiceReview[]>([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/admin/reviews?status=${statusFilter}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setReviews(Array.isArray(data) ? data : [])
      setReplyDrafts(
        Object.fromEntries(
          (Array.isArray(data) ? data : []).map((r: ServiceReview) => [r.id, r.admin_reply ?? ''])
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    }
  }

  useEffect(() => {
    loadReviews()
  }, [statusFilter])

  const moderate = async (
    id: string,
    update: Partial<{ status: ServiceReview['status']; is_featured: boolean; admin_reply: string | null }>
  ) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...update }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      await loadReviews()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      await loadReviews()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reviews & ratings</h1>
        <p className="text-slate-600 mt-1">
          Moderate customer reviews before they appear on the homepage and public reviews page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-slate-700">Filter</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter === 'pending' && pendingCount > 0 ? (
          <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            {pendingCount} awaiting approval
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-600">
            No reviews in this category yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{review.reviewer_name}</CardTitle>
                    <p className="text-sm text-slate-600">
                      {review.reviewer_email ?? 'No email'} · {REVIEW_CONTEXT_LABELS[review.context as ReviewContext]} ·{' '}
                      {formatReviewDate(review.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay rating={review.rating} />
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        review.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : review.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {review.status}
                    </span>
                    {review.is_featured ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> Featured
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.title ? <p className="font-medium text-slate-900">{review.title}</p> : null}
                <p className="text-slate-700 whitespace-pre-wrap">{review.comment}</p>

                <div>
                  <Label className="text-slate-700">Admin reply (shown publicly when published)</Label>
                  <Textarea
                    className="mt-1"
                    rows={2}
                    value={replyDrafts[review.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                    placeholder="Optional response from your team…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={loading}
                    onClick={() => moderate(review.id, { admin_reply: replyDrafts[review.id] ?? '' })}
                  >
                    Save reply
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {review.status !== 'published' ? (
                    <Button
                      size="sm"
                      className="bg-green-700 hover:bg-green-800 text-white"
                      disabled={loading}
                      onClick={() => moderate(review.id, { status: 'published' })}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  ) : null}
                  {review.status !== 'rejected' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => moderate(review.id, { status: 'rejected' })}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  ) : null}
                  {review.status === 'published' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => moderate(review.id, { is_featured: !review.is_featured })}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      {review.is_featured ? 'Unfeature' : 'Feature on homepage'}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => remove(review.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
