import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseOptionalUuid } from '@/lib/shop/staff-api/common'
import {
  fetchPaymentForReview,
  isShopCommercePayment,
  reviewPaymentCore,
  type PaymentReviewActor,
} from '@/lib/admin/review-payment-core'

export function parseStaffPaymentDecision(
  raw: unknown
): 'approved' | 'rejected' | null {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'approve' || value === 'approved') return 'approved'
  if (value === 'reject' || value === 'rejected') return 'rejected'
  return null
}

/**
 * Resolve a commerce shop-order payment from orderId, then reuse reviewPaymentCore().
 * Rejects Academy / Library / Support (and any non-shop) payments even if a UUID is valid.
 */
export async function reviewStaffShopOrderPayment(input: {
  actor: PaymentReviewActor
  orderId: unknown
  decision: unknown
  adminNotes?: unknown
}): Promise<{ success: true } | { error: string; httpStatus: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }

  const orderId = parseOptionalUuid(String(input.orderId ?? '').trim())
  if (!orderId) return { error: 'Valid orderId is required', httpStatus: 400 }

  const decision = parseStaffPaymentDecision(input.decision)
  if (!decision) return { error: 'decision must be approve or reject', httpStatus: 400 }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, payment_id, channel')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) return { error: 'Failed to load order', httpStatus: 500 }
  if (!order) return { error: 'Order not found', httpStatus: 404 }

  let paymentId = order.payment_id != null ? String(order.payment_id) : ''
  if (!paymentId) {
    const { data: paymentRow } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    paymentId = paymentRow?.id ? String(paymentRow.id) : ''
  }

  if (!paymentId) return { error: 'No payment found for this order', httpStatus: 404 }

  const { payment, error: fetchError } = await fetchPaymentForReview(paymentId)
  if (fetchError || !payment) {
    return { error: fetchError ?? 'Payment not found', httpStatus: 404 }
  }

  if (!isShopCommercePayment(payment) || payment.order_id !== orderId) {
    return { error: 'This payment is not a shop order', httpStatus: 403 }
  }

  const adminNotes =
    input.adminNotes != null && String(input.adminNotes).trim()
      ? String(input.adminNotes).trim()
      : undefined

  const result = await reviewPaymentCore(input.actor, {
    id: payment.id,
    decision,
    adminNotes,
  })

  if (!result.success) {
    const message = result.error ?? 'Payment review failed'
    const forbidden = /permission/i.test(message)
    return { error: message, httpStatus: forbidden ? 403 : 400 }
  }

  return { success: true }
}
