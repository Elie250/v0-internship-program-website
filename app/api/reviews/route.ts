import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { queryPublishedReviews, createReview } from '@/lib/reviews/queries'
import type { ReviewContext } from '@/lib/reviews/types'
import { REVIEW_CONTEXTS } from '@/lib/reviews/types'

type SessionUser = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as SessionUser
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? 12)
    const featured = searchParams.get('featured') === 'true'
    const context = searchParams.get('context') as ReviewContext | null

    const { reviews, stats, error } = await queryPublishedReviews({
      limit: Math.min(limit, 50),
      featuredOnly: featured,
      context: context && REVIEW_CONTEXTS.some((c) => c.value === context) ? context : undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ reviews, stats })
  } catch {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionUser = await getSessionUser()

    const reviewerName =
      String(body.reviewerName ?? '').trim() ||
      [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ').trim()

    const reviewerEmail = String(body.reviewerEmail ?? sessionUser?.email ?? '').trim()
    const context = String(body.context ?? 'general') as ReviewContext

    if (!reviewerName) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }
    if (!reviewerEmail) {
      return NextResponse.json({ error: 'Your email is required' }, { status: 400 })
    }

    const result = await createReview({
      reviewerName,
      reviewerEmail,
      reviewerRole: sessionUser?.role ?? String(body.reviewerRole ?? '').trim() || undefined,
      userId: sessionUser?.id ?? null,
      serviceId: body.serviceId ? String(body.serviceId) : null,
      rating: Number(body.rating),
      title: body.title ? String(body.title) : undefined,
      comment: String(body.comment ?? ''),
      context: REVIEW_CONTEXTS.some((c) => c.value === context) ? context : 'general',
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Thank you! Your review was submitted and will appear after our team approves it.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
