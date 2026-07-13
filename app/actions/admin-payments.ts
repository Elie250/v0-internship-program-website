'use server'

import { runInBackground, isLikelyValidEmail } from '@/lib/async/background-task'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission, getAdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS, hasPermission } from '@/lib/admin/permissions'
import { admitEnrollmentById, rejectEnrollmentById } from '@/lib/enrollment/admit'
import {
  isPendingPaymentStatus,
  paymentStatusForApproval,
  safeReviewedById,
} from '@/lib/payments/status'

type PaymentReviewRow = {
  id: string
  status: string
  course_enrollment_id: string | null
  support_subscription_id: string | null
  library_purchase_id: string | null
  application_id: string | null
  order_id: string | null
}

async function fetchPaymentForReview(paymentId: string): Promise<{
  payment: PaymentReviewRow | null
  error?: string
}> {
  if (!supabaseAdmin) return { payment: null, error: 'Database not configured' }

  const withOrder =
    'id, status, course_enrollment_id, support_subscription_id, library_purchase_id, application_id, order_id'
  const base =
    'id, status, course_enrollment_id, support_subscription_id, library_purchase_id, application_id'

  const primary = await supabaseAdmin
    .from('payments')
    .select(withOrder)
    .eq('id', paymentId)
    .maybeSingle()

  let data = primary.data as Record<string, unknown> | null
  let error = primary.error

  if (error?.message?.includes('order_id')) {
    const retry = await supabaseAdmin
      .from('payments')
      .select('id, status, course_enrollment_id, support_subscription_id, application_id')
      .eq('id', paymentId)
      .maybeSingle()
    data = retry.data as Record<string, unknown> | null
    error = retry.error
  }

  if (error?.message?.includes('library_purchase_id')) {
    const retry = await supabaseAdmin
      .from('payments')
      .select('id, status, course_enrollment_id, support_subscription_id, application_id, order_id')
      .eq('id', paymentId)
      .maybeSingle()
    data = retry.data as Record<string, unknown> | null
    error = retry.error
  }

  if (error || !data) {
    return { payment: null, error: error?.message ?? 'Payment not found' }
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

function canReviewPayment(
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

export type PaymentRecord = {
  id: string
  amount: number
  status: string
  payment_method: string | null
  receipt_number: string | null
  receipt_url: string | null
  payer_name: string | null
  payer_email: string | null
  payer_phone: string | null
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  application_id: string | null
  student_id: string | null
  course_enrollment_id: string | null
  support_subscription_id: string | null
  course_id: string | null
  created_at: string
}

/** Manual payment workflow — no gateway. Admin reviews receipt visually. */
export async function listPendingPayments(): Promise<{
  success: boolean
  payments?: PaymentRecord[]
  error?: string
}> {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_VIEW)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(
        'id, amount, status, payment_method, receipt_number, receipt_url, payer_name, payer_email, payer_phone, admin_notes, reviewed_by, reviewed_at, application_id, student_id, course_enrollment_id, support_subscription_id, course_id, created_at'
      )
      .in('status', ['pending_review', 'Pending', 'pending'])
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, payments: data ?? [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load payments',
    }
  }
}

export async function listAllPayments(): Promise<{
  success: boolean
  payments?: PaymentRecord[]
  error?: string
}> {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_VIEW)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(
        'id, amount, status, payment_method, receipt_number, receipt_url, payer_name, payer_email, payer_phone, admin_notes, reviewed_by, reviewed_at, application_id, student_id, course_enrollment_id, support_subscription_id, course_id, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return { success: false, error: error.message }
    return { success: true, payments: data ?? [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load payments',
    }
  }
}

export async function reviewPayment(input: {
  id: string
  decision: 'approved' | 'rejected'
  adminNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { payment: existing, error: fetchError } = await fetchPaymentForReview(input.id)

    if (fetchError || !existing) {
      return { success: false, error: fetchError ?? 'Payment not found' }
    }

    if (!canReviewPayment(session.user.permissions, existing)) {
      return { success: false, error: 'You do not have permission to review this payment' }
    }

    const status = paymentStatusForApproval(input.decision)
    const reviewedBy = safeReviewedById(session?.user.id)
    const now = new Date().toISOString()

    if (!isPendingPaymentStatus(String(existing.status))) {
      if (input.decision === 'approved' && String(existing.status) === 'approved') {
        if (existing.course_enrollment_id) {
          await admitEnrollmentById(existing.course_enrollment_id as string)
        }
        if (existing.library_purchase_id) {
          await supabaseAdmin
            .from('library_purchases')
            .update({ status: 'active', updated_at: now })
            .eq('id', existing.library_purchase_id)
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

    if (error) return { success: false, error: error.message }

    if (existing.application_id && input.decision === 'approved') {
      await supabaseAdmin
        .from('applications')
        .update({ status: 'payment_verified', updated_at: now })
        .eq('id', existing.application_id)
    }

    if (existing.course_enrollment_id) {
      if (input.decision === 'approved') {
        const admitted = await admitEnrollmentById(existing.course_enrollment_id as string)
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
        await rejectEnrollmentById(existing.course_enrollment_id as string, input.adminNotes)
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
        const activated = await activateSupportSubscription(
          existing.support_subscription_id as string
        )
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
        await rejectSupportSubscription(existing.support_subscription_id as string)
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
      if (input.decision === 'approved') {
        const { error: purchaseError } = await supabaseAdmin
          .from('library_purchases')
          .update({ status: 'active', updated_at: now })
          .eq('id', existing.library_purchase_id)
        if (purchaseError?.message?.includes('library_purchases')) {
          return { success: false, error: 'Run scripts/61-library-payments.sql in Supabase.' }
        }
        if (purchaseError) {
          return { success: false, error: purchaseError.message }
        }
      } else {
        await supabaseAdmin
          .from('library_purchases')
          .update({ status: 'rejected', updated_at: now })
          .eq('id', existing.library_purchase_id)
      }
    }

    if (existing.order_id) {
      if (input.decision === 'approved') {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            paid_at: now,
            updated_at: now,
          })
          .eq('id', existing.order_id)
      } else {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'rejected',
            status: 'cancelled',
            updated_at: now,
          })
          .eq('id', existing.order_id)
      }
    }

    if (!existing.course_enrollment_id && !existing.support_subscription_id && !existing.library_purchase_id) {
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review payment',
    }
  }
}

export async function submitManualPayment(input: {
  amount: number
  payerName: string
  payerEmail: string
  payerPhone?: string
  paymentMethod: string
  receiptUrl: string
  receiptNumber?: string
  applicationId?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { error } = await supabaseAdmin.from('payments').insert([
      {
        amount: input.amount,
        payer_name: input.payerName.trim(),
        payer_email: input.payerEmail.trim(),
        payer_phone: input.payerPhone?.trim() || null,
        payment_method: input.paymentMethod.trim(),
        receipt_url: input.receiptUrl.trim(),
        receipt_number: input.receiptNumber?.trim() || null,
        application_id: input.applicationId || null,
        status: 'pending_review',
      },
    ])

    if (error) return { success: false, error: error.message }

    const { sendPaymentSubmittedToAdmin } = await import('@/lib/email/notifications')
    void sendPaymentSubmittedToAdmin({
      payerName: input.payerName.trim(),
      payerEmail: input.payerEmail.trim(),
      amount: input.amount,
      context: input.applicationId ? 'Programme application' : 'Manual payment',
      receiptNumber: input.receiptNumber,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit payment',
    }
  }
}

export async function refundPayment(input: {
  id: string
  adminNotes?: string
  deleteReceipt?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_APPROVE)
    const session = await getAdminSession()
    const { refundApprovedPayment } = await import('@/lib/admin/refund-payment')
    return refundApprovedPayment(input.id, {
      adminNotes: input.adminNotes,
      deleteReceipt: input.deleteReceipt ?? true,
      reviewedBy: session?.user.id ?? null,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund payment',
    }
  }
}

export async function removePaymentReceipt(input: {
  id: string
  adminNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_APPROVE)
    const session = await getAdminSession()
    const { deletePaymentReceipt } = await import('@/lib/admin/refund-payment')
    return deletePaymentReceipt(input.id, {
      adminNotes: input.adminNotes,
      reviewedBy: session?.user.id ?? null,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete receipt',
    }
  }
}
