import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ENROLLMENT_STATUS } from '@/lib/enrollment/constants'

export async function revokeEnrollmentAccess(
  enrollmentId: string,
  options?: { adminNotes?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: enrollment, error: fetchError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status, admin_notes')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (fetchError || !enrollment) {
    return { success: false, error: fetchError?.message ?? 'Enrollment not found' }
  }

  const now = new Date().toISOString()
  const wasAdmitted = enrollment.status === ENROLLMENT_STATUS.ADMITTED
  const note = options?.adminNotes?.trim()
  const adminNotes = [enrollment.admin_notes, note].filter(Boolean).join('\n') || null

  const { error } = await supabaseAdmin
    .from('course_enrollments')
    .update({
      status: ENROLLMENT_STATUS.REFUNDED,
      access_ends_at: wasAdmitted ? now : null,
      admin_notes: adminNotes,
      updated_at: now,
    })
    .eq('id', enrollmentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
