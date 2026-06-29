import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** Attach orphan enrollments to a user account by email match. */
export async function linkEnrollmentsToUser(userId: string, email: string): Promise<number> {
  if (!supabaseAdmin) return 0

  const trimmed = email.trim()
  const { data, error } = await supabaseAdmin
    .from('course_enrollments')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .ilike('applicant_email', trimmed)
    .is('user_id', null)
    .select('id')

  if (error) {
    console.error('[enrollment] linkEnrollmentsToUser:', error.message)
    return 0
  }

  return data?.length ?? 0
}
