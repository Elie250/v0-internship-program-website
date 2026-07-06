export const REVIEW_CONTEXTS = [
  { value: 'training', label: 'Training programme' },
  { value: 'internship', label: 'Internship' },
  { value: 'engineering_support', label: 'Engineering support' },
  { value: 'shop', label: 'Shop / products' },
  { value: 'career_events', label: 'Career & events' },
  { value: 'general', label: 'Overall experience' },
] as const

export type ReviewContext = (typeof REVIEW_CONTEXTS)[number]['value']

export type ServiceReview = {
  id: string
  service_id: string | null
  user_id: string | null
  reviewer_name: string
  reviewer_email: string | null
  reviewer_role: string | null
  rating: number
  title: string | null
  comment: string
  context: ReviewContext
  status: 'pending' | 'published' | 'rejected'
  is_featured: boolean
  admin_reply: string | null
  created_at: string
  updated_at: string
}

export type ReviewStats = {
  averageRating: number
  totalPublished: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export const REVIEW_CONTEXT_LABELS: Record<ReviewContext, string> = Object.fromEntries(
  REVIEW_CONTEXTS.map((c) => [c.value, c.label])
) as Record<ReviewContext, string>

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
