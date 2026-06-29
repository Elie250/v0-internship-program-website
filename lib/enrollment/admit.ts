import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { computeAccessWindow } from '@/lib/enrollment/access'

export async function admitEnrollmentById(
  enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: enrollment, error: fetchError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, course_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (fetchError || !enrollment) {
    return { success: false, error: fetchError?.message ?? 'Enrollment not found' }
  }

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('program_start_date, program_end_date, default_access_days')
    .eq('id', enrollment.course_id)
    .maybeSingle()

  const admittedAt = new Date()
  const { accessStartsAt, accessEndsAt } = computeAccessWindow(
    {
      program_start_date: course?.program_start_date ?? null,
      program_end_date: course?.program_end_date ?? null,
      default_access_days: course?.default_access_days ?? 90,
    },
    admittedAt
  )

  const { error } = await supabaseAdmin
    .from('course_enrollments')
    .update({
      status: 'admitted',
      admitted_at: admittedAt.toISOString(),
      access_starts_at: accessStartsAt,
      access_ends_at: accessEndsAt,
      updated_at: admittedAt.toISOString(),
    })
    .eq('id', enrollmentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function rejectEnrollmentById(
  enrollmentId: string,
  reason?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('course_enrollments')
    .update({
      status: 'payment_rejected',
      rejection_reason: reason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
