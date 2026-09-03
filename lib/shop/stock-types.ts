/** Inventory movement types for the commerce ledger. */
export const STOCK_MOVEMENT_TYPES = [
  'SALE',
  'PURCHASE',
  'ADJUSTMENT',
  'RETURN',
  'DAMAGE',
  'TRANSFER',
  'RESERVE',
  'RELEASE',
] as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export type StockLine = {
  productId: string
  quantity: number
}

export function isInsufficientStockError(message: string | undefined): boolean {
  if (!message) return false
  return /insufficient_stock/i.test(message) || /P0001/.test(message)
}

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const key = value.trim()
  if (key.length < 8 || key.length > 128) return null
  if (!/^[a-zA-Z0-9._:-]+$/.test(key)) return null
  return key
}
