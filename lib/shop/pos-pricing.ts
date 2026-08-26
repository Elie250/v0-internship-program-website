/**
 * Display-only POS pricing preview.
 * Authoritative totals are always recalculated server-side in createCommerceSale / buildOrderLines.
 */
export function previewUnitPrice(price: number, discount = 0): number {
  const unit = Number(price) - Number(discount ?? 0)
  if (!Number.isFinite(unit)) return 0
  return Math.max(0, unit)
}

export function previewLineTotal(unitPrice: number, quantity: number): number {
  const qty = Number(quantity)
  if (!Number.isFinite(qty) || qty < 1) return 0
  return previewUnitPrice(unitPrice, 0) * Math.floor(qty)
}

export function previewCartTotals(
  lines: Array<{ price: number; discount?: number; quantity: number }>
): { listSubtotal: number; discountTotal: number; payableTotal: number } {
  let listSubtotal = 0
  let payableTotal = 0
  for (const line of lines) {
    const qty = Math.max(0, Math.floor(Number(line.quantity) || 0))
    const list = Number(line.price) || 0
    const discount = Number(line.discount ?? 0) || 0
    listSubtotal += list * qty
    payableTotal += previewUnitPrice(list, discount) * qty
  }
  return {
    listSubtotal,
    discountTotal: Math.max(0, listSubtotal - payableTotal),
    payableTotal,
  }
}
