export const REFUND_REASONS = [
  { id: 'customer_return', label: 'Customer return', notesRequired: false },
  { id: 'wrong_item', label: 'Wrong item', notesRequired: false },
  { id: 'damaged_item', label: 'Damaged item', notesRequired: false },
  { id: 'duplicate_sale', label: 'Duplicate sale', notesRequired: false },
  { id: 'incorrect_quantity', label: 'Incorrect quantity', notesRequired: false },
  { id: 'other', label: 'Other', notesRequired: true },
] as const

export type ShopRefundStatus = 'none' | 'requested' | 'rejected' | 'partial' | 'full'

export function refundStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'requested':
      return 'Refund requested'
    case 'rejected':
      return 'Refund rejected'
    case 'partial':
      return 'Partially refunded'
    case 'full':
      return 'Fully refunded'
    default:
      return 'No refund'
  }
}

export function refundReasonLabel(id: string): string {
  return REFUND_REASONS.find((reason) => reason.id === id)?.label || 'Other'
}

export function isPosRefundEligible(order: {
  channel?: string | null
  paymentStatus?: string | null
  stockState?: string | null
  status?: string | null
  refundStatus?: string | null
}): boolean {
  if (String(order.channel ?? '') !== 'pos') return false
  if (!['paid', 'approved'].includes(String(order.paymentStatus ?? ''))) return false
  const fulfillment = String(order.status ?? '').toLowerCase()
  if (fulfillment === 'cancelled' || fulfillment === 'canceled') return false
  if (order.stockState && String(order.stockState) !== 'consumed') return false
  if (order.refundStatus === 'full') return false
  return true
}

export function refundRequestFingerprint(
  items: Array<{ orderItemId: string; quantity: number }>,
  reason: string,
  notes: string
): string {
  return JSON.stringify({
    items: [...items]
      .map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity }))
      .sort((a, b) => a.orderItemId.localeCompare(b.orderItemId)),
    reason,
    notes: notes.trim(),
  })
}

export function newRefundIdempotencyKey(kind: 'request' | 'decision'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `refund-${kind}-${Date.now()}-${rand}`
}
