/** Payment status helpers — legacy DB uses Pending/Paid; app uses pending_review/approved. */

export const PAYMENT_PENDING_STATUSES = [
  'pending_review',
  'gateway_pending',
  'Pending',
  'pending',
] as const

export const PAYMENT_APPROVED_STATUSES = ['approved', 'Paid'] as const

export const PAYMENT_REJECTED_STATUSES = ['rejected', 'Rejected'] as const

export const PAYMENT_REFUNDED_STATUSES = ['refunded', 'Refunded'] as const

export function isPendingPaymentStatus(status: string | null | undefined): boolean {
  if (!status) return false
  return PAYMENT_PENDING_STATUSES.includes(status as (typeof PAYMENT_PENDING_STATUSES)[number])
}

export function isApprovedPaymentStatus(status: string | null | undefined): boolean {
  if (!status) return false
  return PAYMENT_APPROVED_STATUSES.includes(status as (typeof PAYMENT_APPROVED_STATUSES)[number])
}

export function paymentStatusForApproval(decision: 'approved' | 'rejected'): string {
  return decision === 'approved' ? 'approved' : 'rejected'
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function safeReviewedById(userId: string | null | undefined): string | null {
  if (!userId) return null
  return UUID_RE.test(userId) ? userId : null
}
