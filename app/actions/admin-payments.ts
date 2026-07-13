'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission, getAdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { reviewPaymentCore } from '@/lib/admin/review-payment-core'

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
    return await reviewPaymentCore(session, input)
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
