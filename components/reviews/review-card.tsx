import { Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StarRatingDisplay } from '@/components/reviews/star-rating'
import { REVIEW_CONTEXT_LABELS, formatReviewDate, type ServiceReview } from '@/lib/reviews/types'

export function ReviewCard({ review, compact = false }: { review: ServiceReview; compact?: boolean }) {
  const initials = review.reviewer_name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 rounded-full bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] flex items-center justify-center text-sm font-semibold shrink-0"
              aria-hidden
            >
              {initials || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{review.reviewer_name}</p>
              <p className="text-xs text-slate-500">
                {REVIEW_CONTEXT_LABELS[review.context]} · {formatReviewDate(review.created_at)}
              </p>
            </div>
          </div>
          <Quote className="h-5 w-5 text-amber-400/60 shrink-0" aria-hidden />
        </div>

        <StarRatingDisplay rating={review.rating} className="mb-2" />

        {review.title ? (
          <p className="font-medium text-slate-900 mb-2">{review.title}</p>
        ) : null}

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{review.comment}</p>

        {review.admin_reply ? (
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-semibold text-[var(--brand-navy)] mb-1">Response from Energy & Logics</p>
            <p className="text-sm text-slate-600">{review.admin_reply}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
