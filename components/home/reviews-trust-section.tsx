import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/reviews/review-card'
import { StarRatingDisplay } from '@/components/reviews/star-rating'
import { queryPublishedReviews } from '@/lib/reviews/queries'

export async function ReviewsTrustSection() {
  const { reviews, stats } = await queryPublishedReviews({ limit: 6, featuredOnly: false })

  const hasReviews = reviews.length > 0

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)] mb-2">
            Trusted by learners & clients
          </p>
          <h2 className="section-title">What people say about us</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mt-3">
            Real ratings and reviews from students, interns, and engineering clients help you choose with confidence.
          </p>
        </div>

        {hasReviews ? (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 p-6 rounded-xl bg-white border border-slate-200 shadow-sm max-w-xl mx-auto">
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-[var(--brand-navy)] text-white">
            <Link href="/reviews">Read all reviews</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/reviews#write-review">Write a review</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
