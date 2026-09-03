/** Pure shop refund rules. Original sales remain immutable. */

export const REFUND_REASONS = [
  { id: 'customer_return', label: 'Customer return', notesRequired: false },
  { id: 'wrong_item', label: 'Wrong item', notesRequired: false },
  { id: 'damaged_item', label: 'Damaged item', notesRequired: false },
  { id: 'duplicate_sale', label: 'Duplicate sale', notesRequired: false },
  { id: 'incorrect_quantity', label: 'Incorrect quantity', notesRequired: false },
  { id: 'other', label: 'Other', notesRequired: true },
] as const

export type RefundReasonId = (typeof REFUND_REASONS)[number]['id']
export type ShopRefundRecordStatus = 'requested' | 'approved' | 'rejected'
export type ShopRefundStatus = 'none' | 'requested' | 'rejected' | 'partial' | 'full'

export const REFUND_REASON_IDS = REFUND_REASONS.map((reason) => reason.id)

export function refundReasonLabel(id: string): string {
  return REFUND_REASONS.find((reason) => reason.id === id)?.label || 'Other'
}

export function refundReasonRequiresNotes(id: string): boolean {
  return REFUND_REASONS.some((reason) => reason.id === id && reason.notesRequired)
}

export function isPaidCommerceStatus(status: string | null | undefined): boolean {
  return ['paid', 'approved'].includes(String(status ?? ''))
}

export function isPosRefundEligibleOrder(order: {
  channel?: string | null
  paymentStatus?: string | null
  stockState?: string | null
  status?: string | null
}): boolean {
  if (String(order.channel ?? '') !== 'pos') return false
  if (!isPaidCommerceStatus(order.paymentStatus)) return false
  const fulfillment = String(order.status ?? '').toLowerCase()
  if (fulfillment === 'cancelled' || fulfillment === 'canceled') return false
  if (order.stockState && String(order.stockState) !== 'consumed') return false
  return true
}

export function refundableQuantity(soldQuantity: number, alreadyCommitted: number): number {
  const sold = Math.max(0, Math.floor(Number(soldQuantity) || 0))
  const committed = Math.max(0, Math.floor(Number(alreadyCommitted) || 0))
  return Math.max(0, sold - committed)
}

export function refundLineAmount(unitPrice: number, quantity: number): number {
  const qty = Math.floor(Number(quantity) || 0)
  if (qty < 1) return 0
  return Number(unitPrice) * qty
}

export function aggregateRefundStatus(input: {
  soldQuantity: number
  approvedQuantity: number
  requestedQuantity: number
  hasRejected: boolean
}): ShopRefundStatus {
  const sold = Math.max(0, Math.floor(Number(input.soldQuantity) || 0))
  const approved = Math.max(0, Math.floor(Number(input.approvedQuantity) || 0))
  const requested = Math.max(0, Math.floor(Number(input.requestedQuantity) || 0))
  if (sold > 0 && approved >= sold) return 'full'
  if (approved > 0) return 'partial'
  if (requested > 0) return 'requested'
  if (input.hasRejected) return 'rejected'
  return 'none'
}

export function refundStatusLabel(status: ShopRefundStatus): string {
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

export function refundRequestFingerprint(input: {
  orderId: string
  items: Array<{ orderItemId: string; quantity: number }>
  reason: string
  notes?: string | null
}): { orderId: string; items: Array<{ orderItemId: string; quantity: number }>; reason: string; notes: string } {
  return {
    orderId: input.orderId,
    items: [...input.items]
      .map((item) => ({
        orderItemId: String(item.orderItemId),
        quantity: Math.floor(Number(item.quantity) || 0),
      }))
      .sort((a, b) => a.orderItemId.localeCompare(b.orderItemId)),
    reason: String(input.reason),
    notes: String(input.notes ?? '').trim(),
  }
}
