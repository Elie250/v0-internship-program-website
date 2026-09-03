export type StockTone = 'green' | 'amber' | 'red'

export function stockState(
  stock: number,
  threshold?: number | null
): { label: string; tone: StockTone; canSell: boolean } {
  const qty = Number(stock) || 0
  if (qty <= 0) return { label: 'Out of stock', tone: 'red', canSell: false }
  if (threshold != null && Number.isFinite(threshold) && qty <= Number(threshold)) {
    return { label: 'Low stock', tone: 'amber', canSell: true }
  }
  return { label: 'Available', tone: 'green', canSell: true }
}
