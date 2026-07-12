import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/reviews/review-card'
import { queryPublishedReviews } from '@/lib/reviews/queries'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ReviewsTrustSection({ compact = false }: { compact?: boolean }) {
  const limit = compact ? 2 : 6
  const { reviews, stats } = await queryPublishedReviews({ limit, featuredOnly: false })

  const hasReviews = reviews.length > 0

  return (
    <section
      id="reviews"
      className={`home-section ${compact ? 'home-section--compact home-section--white' : 'home-section--white'}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Reviews"
            title="What people say about us"
            description={compact ? undefined : 'Real ratings and reviews from students, interns, and engineering clients.'}
            align="left"
            className="mb-0"
          />
          {hasReviews ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-900">{stats.averageRating.toFixed(1)}</span>
              <span>({stats.totalPublished} reviews)</span>
            </div>
          ) : null}
        </div>

        {hasReviews ? (
          <>
            <div
              className={
                compact
                  ? 'grid md:grid-cols-2 gap-4 mb-4'
                  : 'grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8'
              }
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} compact />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 mb-8 rounded-xl border border-dashed border-slate-300 bg-white">
            <Star className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <p className="text-slate-600 max-w-md mx-auto">
              Be among the first to share your experience with our training, internship, or engineering support services.
            </p>
          </div>
        )}

        <div className={`flex flex-wrap items-center gap-3 ${compact ? '' : 'justify-center'}`}>
          <Button asChild size={compact ? 'sm' : 'default'} className="bg-[var(--brand-navy)] text-white">
            <Link href="/reviews">Read all reviews</Link>
          </Button>
          {!compact ? (
            <Button asChild variant="outline">
              <Link href="/reviews#write-review">Write a review</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
