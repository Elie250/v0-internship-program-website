import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { revokeEnrollmentAccess } from '@/lib/enrollment/revoke-access'
import { deletePlatformMediaFile } from '@/lib/storage/platform-media'

export async function refundApprovedPayment(
  paymentId: string,
  options: {
    adminNotes?: string
    deleteReceipt?: boolean
    reviewedBy?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select(
      'id, status, receipt_url, course_enrollment_id, support_subscription_id, admin_notes'
    )
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError || !payment) {
    return { success: false, error: fetchError?.message ?? 'Payment not found' }
  }

  const status = String(payment.status)
  if (status === 'refunded') {
    return { success: false, error: 'Payment is already refunded' }
  }
  if (!['approved', 'Paid'].includes(status)) {
    return {
      success: false,
      error: 'Only approved payments can be refunded. Reject pending payments instead.',
    }
  }

  const receiptUrl = payment.receipt_url as string | null
  const note = options.adminNotes?.trim()
  const mergedNotes = [payment.admin_notes, note ? `Refund: ${note}` : 'Refunded by admin']
    .filter(Boolean)
    .join('\n')

  if (options.deleteReceipt && receiptUrl) {
    try {
      await deletePlatformMediaFile(receiptUrl)
    } catch {
      // Storage delete is best-effort; still clear the URL in DB
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'refunded',
      receipt_url: options.deleteReceipt ? null : payment.receipt_url,
      admin_notes: mergedNotes || null,
      reviewed_by: options.reviewedBy ?? null,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', paymentId)

  if (updateError) return { success: false, error: updateError.message }

  if (payment.course_enrollment_id) {
    const revoke = await revokeEnrollmentAccess(payment.course_enrollment_id as string, {
      adminNotes: note || 'Access revoked due to payment refund',
    })
    if (!revoke.success) return revoke
  }

  if (payment.support_subscription_id) {
    const { revokeSupportSubscription } = await import('@/lib/support/revoke-subscription')
    const revoke = await revokeSupportSubscription(payment.support_subscription_id as string, {
      adminNotes: note || 'Support subscription refunded',
    })
    if (!revoke.success) return revoke
  }

  return { success: true }
}

export async function deletePaymentReceipt(
  paymentId: string,
  options?: { adminNotes?: string; reviewedBy?: string | null }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, status, receipt_url, admin_notes, course_enrollment_id')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError || !payment) {
    return { success: false, error: fetchError?.message ?? 'Payment not found' }
  }

  if (String(payment.status) === 'refunded') {
    return { success: false, error: 'Payment is already refunded' }
  }

  const receiptUrl = payment.receipt_url as string | null
  if (!receiptUrl) {
    return { success: false, error: 'No receipt on file to delete' }
  }

  const note = options?.adminNotes?.trim()
  const mergedNotes = [payment.admin_notes, note ? `Receipt removed: ${note}` : 'Receipt removed by admin']
    .filter(Boolean)
    .join('\n')

  try {
    await deletePlatformMediaFile(receiptUrl)
  } catch {
    // Continue clearing DB reference even if storage delete fails
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      receipt_url: null,
      admin_notes: mergedNotes || null,
      reviewed_by: options?.reviewedBy ?? null,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', paymentId)

  if (updateError) return { success: false, error: updateError.message }
  return { success: true }
}

/** Revoke course access and refund any linked approved payment. */
export async function revokeEnrollmentWithPayment(
  enrollmentId: string,
  options: {
    adminNotes?: string
    deleteReceipt?: boolean
    reviewedBy?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('course_enrollment_id', enrollmentId)
    .in('status', ['approved', 'Paid'])

  const approvedPayment = payments?.[0]
  if (approvedPayment) {
    return refundApprovedPayment(approvedPayment.id, {
      adminNotes: options.adminNotes,
      deleteReceipt: options.deleteReceipt,
      reviewedBy: options.reviewedBy,
    })
  }

  return revokeEnrollmentAccess(enrollmentId, { adminNotes: options.adminNotes })
}
