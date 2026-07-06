import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { ReviewContext, ReviewStats, ServiceReview } from '@/lib/reviews/types'

function mapReview(row: Record<string, unknown>): ServiceReview {
  return {
    id: String(row.id),
    service_id: row.service_id ? String(row.service_id) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    reviewer_name: String(row.reviewer_name ?? ''),
    reviewer_email: (row.reviewer_email as string | null) ?? null,
    reviewer_role: (row.reviewer_role as string | null) ?? null,
    rating: Number(row.rating ?? 0),
    title: (row.title as string | null) ?? null,
    comment: String(row.comment ?? ''),
    context: String(row.context ?? 'general') as ServiceReview['context'],
    status: String(row.status ?? 'pending') as ServiceReview['status'],
    is_featured: Boolean(row.is_featured),
    admin_reply: (row.admin_reply as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export function computeReviewStats(reviews: ServiceReview[]): ReviewStats {
  const distribution: ReviewStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (!reviews.length) {
    return { averageRating: 0, totalPublished: 0, distribution }
  }
  let sum = 0
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
    distribution[star] += 1
    sum += r.rating
  }
  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    totalPublished: reviews.length,
    distribution,
  }
}

export async function queryPublishedReviews(options?: {
  limit?: number
  featuredOnly?: boolean
  context?: ReviewContext
}): Promise<{ reviews: ServiceReview[]; stats: ReviewStats; error?: string }> {
  if (!supabaseAdmin) return { reviews: [], stats: computeReviewStats([]), error: 'Database not configured' }

  let query = supabaseAdmin
    .from('service_reviews')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (options?.featuredOnly) query = query.eq('is_featured', true)
  if (options?.context) query = query.eq('context', options.context)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) return { reviews: [], stats: computeReviewStats([]), error: error.message }

  const reviews = (data ?? []).map((r) => mapReview(r as Record<string, unknown>))

  const { data: allPublished } = await supabaseAdmin
    .from('service_reviews')
    .select('rating')
    .eq('status', 'published')

  const stats = computeReviewStats(
    (allPublished ?? []).map((r) => mapReview({ ...r, status: 'published' } as Record<string, unknown>))
  )

  return { reviews, stats }
}

export async function queryAllReviews(status?: string): Promise<{
  reviews: ServiceReview[]
  error?: string
}> {
  if (!supabaseAdmin) return { reviews: [], error: 'Database not configured' }

  let query = supabaseAdmin.from('service_reviews').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return { reviews: [], error: error.message }
  return { reviews: (data ?? []).map((r) => mapReview(r as Record<string, unknown>)) }
}

export async function createReview(input: {
  reviewerName: string
  reviewerEmail?: string
  reviewerRole?: string
  userId?: string | null
  serviceId?: string | null
  rating: number
  title?: string
  comment: string
  context: ReviewContext
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const rating = Math.round(input.rating)
  if (rating < 1 || rating > 5) return { success: false, error: 'Rating must be between 1 and 5 stars' }

  const comment = input.comment.trim()
  if (comment.length < 20) {
    return { success: false, error: 'Please write at least 20 characters in your review' }
  }

  const { error } = await supabaseAdmin.from('service_reviews').insert([
    {
      reviewer_name: input.reviewerName.trim(),
      reviewer_email: input.reviewerEmail?.trim() || null,
      reviewer_role: input.reviewerRole?.trim() || null,
      user_id: input.userId ?? null,
      service_id: input.serviceId ?? null,
      rating,
      title: input.title?.trim() || null,
      comment,
      context: input.context,
      status: 'pending',
    },
  ])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function moderateReview(
  id: string,
  update: Partial<{
    status: 'pending' | 'published' | 'rejected'
    is_featured: boolean
    admin_reply: string | null
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('service_reviews')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteReview(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }
  const { error } = await supabaseAdmin.from('service_reviews').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
