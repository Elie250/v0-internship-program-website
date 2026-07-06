import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isPendingPaymentStatus, paymentStatusForApproval, safeReviewedById } from '@/lib/payments/status'

/** Resolve the payment record linked to a course enrollment. */
export async function resolveEnrollmentPaymentId(enrollmentId: string): Promise<string | null> {
  if (!supabaseAdmin) return null

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('payment_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (enrollment?.payment_id) return String(enrollment.payment_id)

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('course_enrollment_id', enrollmentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return payment?.id ? String(payment.id) : null
}

/** Mark a pending enrollment payment as approved (does not admit — caller handles enrollment). */
export async function approveEnrollmentPaymentRecord(
  paymentId: string,
  options?: { adminNotes?: string; reviewedBy?: string | null }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError || !payment) {
    return { success: false, error: fetchError?.message ?? 'Payment not found' }
  }

  if (!isPendingPaymentStatus(String(payment.status))) {
    return { success: true }
  }

  const now = new Date().toISOString()
  const reviewedBy = safeReviewedById(options?.reviewedBy)
  const updatePayload: Record<string, unknown> = {
    status: paymentStatusForApproval('approved'),
    admin_notes: options?.adminNotes?.trim() || null,
    reviewed_at: now,
    payment_date: now,
    updated_at: now,
  }
  if (reviewedBy) updatePayload.reviewed_by = reviewedBy

  let { error } = await supabaseAdmin.from('payments').update(updatePayload).eq('id', paymentId)

  if (error?.message?.includes('reviewed_by')) {
    const { reviewed_by: _removed, ...withoutReviewer } = updatePayload
    const retry = await supabaseAdmin.from('payments').update(withoutReviewer).eq('id', paymentId)
    error = retry.error
  }

  if (error) return { success: false, error: error.message }
  return { success: true }
}
