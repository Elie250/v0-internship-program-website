import { runInBackground, isLikelyValidEmail } from '@/lib/async/background-task'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { admitEnrollmentById, rejectEnrollmentById } from '@/lib/enrollment/admit'
import {
  isPendingPaymentStatus,
  paymentStatusForApproval,
  safeReviewedById,
} from '@/lib/payments/status'
import type { AdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS, hasPermission } from '@/lib/admin/permissions'

export type PaymentReviewRow = {
  id: string
  status: string
  course_enrollment_id: string | null
  support_subscription_id: string | null
  library_purchase_id: string | null
  application_id: string | null
  order_id: string | null
}

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false
  return (
    /does not exist/i.test(message) ||
    /could not find/i.test(message) ||
    /column/i.test(message)
  )
}

const PAYMENT_REVIEW_SELECTS = [
  'id, status, course_enrollment_id, support_subscription_id, library_purchase_id, application_id, order_id',
  'id, status, course_enrollment_id, support_subscription_id, application_id, order_id',
  'id, status, course_enrollment_id, support_subscription_id, application_id',
  'id, status, course_enrollment_id, application_id',
] as const

export async function fetchPaymentForReview(paymentId: string): Promise<{
  payment: PaymentReviewRow | null
  error?: string
}> {
  if (!supabaseAdmin) return { payment: null, error: 'Database not configured' }

  let data: Record<string, unknown> | null = null
  let lastError: string | undefined

  for (const columns of PAYMENT_REVIEW_SELECTS) {
    const result = await supabaseAdmin
      .from('payments')
      .select(columns)
      .eq('id', paymentId)
      .maybeSingle()

    if (!result.error && result.data) {
      data = result.data as unknown as Record<string, unknown>
      break
    }

    lastError = result.error?.message
    if (!isMissingColumnError(lastError)) {
      break
    }
  }

  if (!data) {
    return { payment: null, error: lastError ?? 'Payment not found' }
  }

  let orderId = (data.order_id as string | null | undefined) ?? null
  if (!orderId) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle()
    orderId = order?.id ?? null
  }

  return {
    payment: {
      id: String(data.id),
      status: String(data.status),
      course_enrollment_id: (data.course_enrollment_id as string | null) ?? null,
      support_subscription_id: (data.support_subscription_id as string | null) ?? null,
      library_purchase_id: (data.library_purchase_id as string | null) ?? null,
      application_id: (data.application_id as string | null) ?? null,
      order_id: orderId,
    },
  }
}

export function canReviewPayment(
  permissions: string[] | undefined,
  payment: PaymentReviewRow
): boolean {
  if (payment.order_id) {
    return hasPermission(permissions, [PERMISSIONS.PAYMENTS_APPROVE, PERMISSIONS.SHOP_ORDERS])
  }
  if (payment.course_enrollment_id) {
    return hasPermission(permissions, [
      PERMISSIONS.PAYMENTS_APPROVE,
      PERMISSIONS.APPLICATIONS_APPROVE,
      PERMISSIONS.LEARNING_STUDENTS,
    ])
  }
  if (payment.library_purchase_id) {
    return hasPermission(permissions, [
      PERMISSIONS.PAYMENTS_APPROVE,
      PERMISSIONS.APPLICATIONS_APPROVE,
      PERMISSIONS.CONTENT_ANNOUNCEMENTS,
    ])
  }
  if (payment.support_subscription_id) {
    return hasPermission(permissions, [PERMISSIONS.PAYMENTS_APPROVE, PERMISSIONS.SUPPORT_TICKETS])
  }
  return hasPermission(permissions, PERMISSIONS.PAYMENTS_APPROVE)
}

async function updateLibraryPurchaseStatus(
  purchaseId: string,
  status: 'active' | 'rejected',
  now: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('library_purchases')
    .update({ status, updated_at: now })
    .eq('id', purchaseId)

  if (!error) return { success: true }
  if (isMissingColumnError(error.message) || error.message.includes('library_purchases')) {
    return { success: true }
  }
  return { success: false, error: error.message }
}

export async function reviewPaymentCore(
  session: AdminSession,
  input: {
    id: string
    decision: 'approved' | 'rejected'
    adminNotes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { payment: existing, error: fetchError } = await fetchPaymentForReview(input.id)

  if (fetchError || !existing) {
    return { success: false, error: fetchError ?? 'Payment not found' }
  }

  if (!canReviewPayment(session.user.permissions, existing)) {
    return { success: false, error: 'You do not have permission to review this payment' }
  }

  const status = paymentStatusForApproval(input.decision)
  const reviewedBy = safeReviewedById(session.user.id)
  const now = new Date().toISOString()

  if (!isPendingPaymentStatus(String(existing.status))) {
    if (input.decision === 'approved' && String(existing.status) === 'approved') {
      if (existing.course_enrollment_id) {
        await admitEnrollmentById(existing.course_enrollment_id)
      }
      if (existing.library_purchase_id) {
        await updateLibraryPurchaseStatus(existing.library_purchase_id, 'active', now)
      }
      return { success: true }
    }
    return {
      success: false,
      error: `Payment is already ${existing.status}. Refresh the page.`,
    }
  }

  const updatePayload: Record<string, unknown> = {
    status,
    admin_notes: input.adminNotes?.trim() || null,
    reviewed_at: now,
    payment_date: input.decision === 'approved' ? now : null,
    updated_at: now,
  }
  if (reviewedBy) {
    updatePayload.reviewed_by = reviewedBy
  }

  let { error } = await supabaseAdmin.from('payments').update(updatePayload).eq('id', input.id)

  if (error?.message?.includes('reviewed_by')) {
    const { reviewed_by: _removed, ...withoutReviewer } = updatePayload
    const retry = await supabaseAdmin.from('payments').update(withoutReviewer).eq('id', input.id)
    error = retry.error
  }

  if (error?.message?.includes('admin_notes')) {
    const { admin_notes: _removed, ...withoutNotes } = updatePayload
    const retry = await supabaseAdmin.from('payments').update(withoutNotes).eq('id', input.id)
    error = retry.error
  }

  if (error?.message?.includes('payment_date')) {
    const { payment_date: _removed, ...withoutDate } = updatePayload
    const retry = await supabaseAdmin.from('payments').update(withoutDate).eq('id', input.id)
    error = retry.error
  }

  if (error?.message?.includes('reviewed_at')) {
    const { reviewed_at: _removed, ...withoutReviewedAt } = updatePayload
    const retry = await supabaseAdmin.from('payments').update(withoutReviewedAt).eq('id', input.id)
    error = retry.error
  }

  if (error) return { success: false, error: error.message }

  if (existing.application_id && input.decision === 'approved') {
    await supabaseAdmin
      .from('applications')
      .update({ status: 'payment_verified', updated_at: now })
      .eq('id', existing.application_id)
  }

  if (existing.course_enrollment_id) {
    if (input.decision === 'approved') {
      const admitted = await admitEnrollmentById(existing.course_enrollment_id)
      if (!admitted.success) {
        return { success: false, error: admitted.error ?? 'Payment saved but enrollment activation failed' }
      }
      const { data: enrolled } = await supabaseAdmin
        .from('course_enrollments')
        .select('applicant_name, applicant_email, amount_due, access_starts_at, course_id')
        .eq('id', existing.course_enrollment_id)
        .maybeSingle()
      let programTitle = 'your programme'
      if (enrolled?.course_id) {
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('title')
          .eq('id', enrolled.course_id)
          .maybeSingle()
        if (course?.title) programTitle = course.title
      }
      if (enrolled?.applicant_email && isLikelyValidEmail(enrolled.applicant_email)) {
        runInBackground(async () => {
          const { sendEnrollmentApprovedEmail } = await import('@/lib/email/enrollment-notifications')
          await sendEnrollmentApprovedEmail({
            to: enrolled.applicant_email,
            studentName: enrolled.applicant_name,
            programTitle,
            amountPaid: Number(enrolled.amount_due ?? 0),
            accessStartsAt: enrolled.access_starts_at,
          })
        }, 'enrollment_approved_email')
      }
    } else {
      await rejectEnrollmentById(existing.course_enrollment_id, input.adminNotes)
      const { data: enrolled } = await supabaseAdmin
        .from('course_enrollments')
        .select('applicant_name, applicant_email, course_id')
        .eq('id', existing.course_enrollment_id)
        .maybeSingle()
      let programTitle = 'your programme'
      if (enrolled?.course_id) {
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('title')
          .eq('id', enrolled.course_id)
          .maybeSingle()
        if (course?.title) programTitle = course.title
      }
      if (enrolled?.applicant_email && isLikelyValidEmail(enrolled.applicant_email)) {
        runInBackground(async () => {
          const { sendEnrollmentRejectedEmail } = await import('@/lib/email/enrollment-notifications')
          await sendEnrollmentRejectedEmail({
            to: enrolled.applicant_email,
            studentName: enrolled.applicant_name,
            programTitle,
            reason: input.adminNotes,
          })
        }, 'enrollment_rejected_email')
      }
    }
  }

  if (existing.support_subscription_id) {
    const { activateSupportSubscription, rejectSupportSubscription } = await import(
      '@/lib/support/activate-subscription'
    )
    const { data: sub } = await supabaseAdmin
      .from('support_subscriptions')
      .select('plan_id, applicant_phone, user:users(first_name, last_name, email)')
      .eq('id', existing.support_subscription_id)
      .maybeSingle()
    let planName = 'Engineering support'
    if (sub?.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from('support_subscription_plans')
        .select('name')
        .eq('id', sub.plan_id)
        .maybeSingle()
      if (plan?.name) planName = plan.name
    }
    const subUser = sub?.user as { first_name?: string; last_name?: string; email?: string } | null
    const subEmail = subUser?.email ?? ''
    const subName =
      [subUser?.first_name, subUser?.last_name].filter(Boolean).join(' ').trim() || 'Engineer'
    if (input.decision === 'approved') {
      const activated = await activateSupportSubscription(existing.support_subscription_id)
      if (!activated.success) {
        return {
          success: false,
          error: activated.error ?? 'Payment saved but subscription activation failed',
        }
      }
      if (subEmail && isLikelyValidEmail(subEmail)) {
        runInBackground(async () => {
          const { sendSubscriptionApprovedEmail } = await import('@/lib/email/enrollment-notifications')
          await sendSubscriptionApprovedEmail({
            to: subEmail,
            name: subName,
            planName,
          })
        }, 'subscription_approved_email')
      }
    } else {
      await rejectSupportSubscription(existing.support_subscription_id)
      if (subEmail && isLikelyValidEmail(subEmail)) {
        runInBackground(async () => {
          const { sendSubscriptionRejectedEmail } = await import('@/lib/email/enrollment-notifications')
          await sendSubscriptionRejectedEmail({
            to: subEmail,
            name: subName,
            planName,
            reason: input.adminNotes,
          })
        }, 'subscription_rejected_email')
      }
    }
  }

  if (existing.library_purchase_id) {
    const purchaseStatus = input.decision === 'approved' ? 'active' : 'rejected'
    const purchaseResult = await updateLibraryPurchaseStatus(
      existing.library_purchase_id,
      purchaseStatus,
      now
    )
    if (!purchaseResult.success) {
      return { success: false, error: purchaseResult.error }
    }
  }

  if (existing.order_id) {
    if (input.decision === 'approved') {
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          paid_at: now,
          updated_at: now,
        })
        .eq('id', existing.order_id)
      if (orderError) {
        return { success: false, error: orderError.message }
      }
    } else {
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'rejected',
          status: 'cancelled',
          updated_at: now,
        })
        .eq('id', existing.order_id)
      if (orderError) {
        return { success: false, error: orderError.message }
      }
    }
  }

  if (
    !existing.course_enrollment_id &&
    !existing.support_subscription_id &&
    !existing.library_purchase_id
  ) {
    runInBackground(async () => {
      const { notifyPaymentReviewed } = await import('@/lib/email/payment-hooks')
      await notifyPaymentReviewed({
        paymentId: input.id,
        decision: input.decision,
        adminNotes: input.adminNotes,
      })
    }, 'payment_review_notify')
  }

  return { success: true }
}
