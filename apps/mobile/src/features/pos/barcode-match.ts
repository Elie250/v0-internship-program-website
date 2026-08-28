/** Pure barcode match rules. Server remains authoritative for which products exist. */

export type BarcodeProduct = {
  id: string
  barcode: string | null
}

export function pickBarcodeMatch<T extends BarcodeProduct>(items: T[], barcode: string): T | null {
  const code = barcode.trim()
  if (!code || !items.length) return null
  const exact = items.filter((item) => item.barcode === code)
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) {
    const uniqueIds = new Set(exact.map((item) => item.id))
    return uniqueIds.size === 1 ? exact[0] : null
  }
  return items.length === 1 ? items[0] : null
}
