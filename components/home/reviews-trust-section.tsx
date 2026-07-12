import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/reviews/review-card'
import { StarRatingDisplay } from '@/components/reviews/star-rating'
import { queryPublishedReviews } from '@/lib/reviews/queries'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ReviewsTrustSection({ compact = false }: { compact?: boolean }) {
  const limit = compact ? 3 : 6
  const { reviews, stats } = await queryPublishedReviews({ limit, featuredOnly: false })

  const hasReviews = reviews.length > 0

  return (
    <section
      id="reviews"
      className={`home-section ${compact ? 'home-section--muted' : 'home-section--white'}`}
    >
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow="Trusted by learners & clients"
          title="What people say about us"
          description={
            compact
              ? 'Verified feedback from students and engineering clients.'
              : 'Real ratings and reviews from students, interns, and engineering clients help you choose with confidence.'
          }
          align={compact ? 'left' : 'center'}
          className={compact ? 'mb-8' : undefined}
        />

        {hasReviews ? (
          <>
            <div
              className={`flex flex-col sm:flex-row items-center gap-6 mb-8 p-5 rounded-xl bg-white border border-slate-200 shadow-sm ${
                compact ? 'max-w-full' : 'max-w-xl mx-auto'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
                  <span className="text-4xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</span>
                </div>
                <StarRatingDisplay rating={stats.averageRating} size="md" className="justify-center mt-2" />
              </div>
              <div className="hidden sm:block h-12 w-px bg-slate-200" />
              <div className="text-center sm:text-left">
                <p className="text-2xl font-bold text-slate-900">{stats.totalPublished}</p>
                <p className="text-sm text-slate-600">verified reviews</p>
              </div>
            </div>

            <div
              className={
                compact
                  ? 'grid md:grid-cols-3 gap-4 mb-6'
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
