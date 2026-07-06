import Link from 'next/link'
import { Star } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewCard } from '@/components/reviews/review-card'
import { ReviewSubmitForm } from '@/components/reviews/review-submit-form'
import { StarRatingDisplay } from '@/components/reviews/star-rating'
import { queryPublishedReviews } from '@/lib/reviews/queries'
import { REVIEW_CONTEXTS } from '@/lib/reviews/types'
import { getCurrentUser } from '@/app/actions/auth-service'

export const metadata = {
  title: 'Reviews & ratings',
  description: 'Read verified reviews and share your experience with Energy & Logics training, internship, and engineering services.',
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>
}) {
  const params = await searchParams
  const contextFilter = REVIEW_CONTEXTS.some((c) => c.value === params.context)
    ? (params.context as (typeof REVIEW_CONTEXTS)[number]['value'])
    : undefined

  const user = await getCurrentUser()
  const defaultName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : ''
  const defaultEmail = user?.email ?? ''

  const { reviews, stats } = await queryPublishedReviews({
    limit: 50,
    context: contextFilter,
  })

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Reviews & ratings</h1>
          <p className="text-white/85 text-lg">
            Honest feedback from our community — moderated for authenticity.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {stats.totalPublished > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 p-6 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Star className="h-10 w-10 fill-amber-400 text-amber-400" />
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</p>
                <StarRatingDisplay rating={stats.averageRating} />
              </div>
            </div>
            <p className="text-slate-600">
              Based on <strong>{stats.totalPublished}</strong> published review
              {stats.totalPublished === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Link
                href="/reviews"
                className={`text-sm px-3 py-1 rounded-full border ${
                  !contextFilter
                    ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                All
              </Link>
              {REVIEW_CONTEXTS.map((c) => (
                <Link
                  key={c.value}
                  href={`/reviews?context=${c.value}`}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    contextFilter === c.value
                      ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5 mb-12">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-600 py-8 mb-8">
            No published reviews yet for this category. Share yours below.
          </p>
        )}

        <Card id="write-review" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Share your experience</CardTitle>
            <p className="text-sm text-slate-600">
              Your review helps others trust our training, internship, shop, and engineering support. We approve reviews before they go live.
            </p>
          </CardHeader>
          <CardContent>
            <ReviewSubmitForm
              defaultName={defaultName}
              defaultEmail={defaultEmail}
              defaultContext={contextFilter ?? 'general'}
            />
          </CardContent>
        </Card>
      </section>

      <SiteFooter />
    </main>
  )
}
