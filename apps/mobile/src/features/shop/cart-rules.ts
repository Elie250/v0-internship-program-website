export type ShopCartLine = {
  slug: string
  name: string
  image: string | null
  displayPrice: number
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  quantity: number
  maxQuantity: number
}

/** Quantity is selling units. Never convert 2 × 5 M into 10. */
export function clampCartQuantity(quantity: number, maxQuantity: number): number {
  const max = Math.max(0, Math.floor(Number(maxQuantity) || 0))
  const q = Math.floor(Number(quantity) || 0)
  if (q < 1 || max < 1) return 0
  return Math.min(q, max)
}

export function nextAddQuantity(current: number, add: number, maxQuantity: number): number {
  const extra = Math.max(1, Math.floor(Number(add) || 1))
  return clampCartQuantity((Number(current) || 0) + extra, maxQuantity)
}

export function canIncreaseCartQuantity(quantity: number, maxQuantity: number): boolean {
  return clampCartQuantity(quantity + 1, maxQuantity) > quantity
}

export function parsePersistedCart(raw: unknown): ShopCartLine[] {
  if (!Array.isArray(raw)) return []
  const lines: ShopCartLine[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const item = row as Record<string, unknown>
    const slug = typeof item.slug === 'string' ? item.slug.trim() : ''
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    const displayPrice = Number(item.displayPrice)
    const sellingQuantity = Number(item.sellingQuantity)
    const sellingUnit = typeof item.sellingUnit === 'string' ? item.sellingUnit : 'PCS'
    const sellingUnitLabel =
      typeof item.sellingUnitLabel === 'string' ? item.sellingUnitLabel : `${sellingQuantity} ${sellingUnit}`
    const maxQuantity = Math.max(0, Math.floor(Number(item.maxQuantity) || 0))
    const quantity = clampCartQuantity(Number(item.quantity), maxQuantity)
    if (!slug || !name || !Number.isFinite(displayPrice) || quantity < 1) continue
    lines.push({
      slug,
      name,
      image: typeof item.image === 'string' ? item.image : null,
      displayPrice,
      sellingQuantity: sellingQuantity > 0 ? sellingQuantity : 1,
      sellingUnit: sellingUnit.trim() || 'PCS',
      sellingUnitLabel,
      quantity,
      maxQuantity,
    })
  }
  return lines
}

export function applyAddProduct(
  lines: ShopCartLine[],
  product: {
    slug: string
    name: string
    image: string | null
    price: number
    sellingQuantity: number
    sellingUnit: string
    sellingUnitLabel: string
    maxQuantity: number
  },
  add = 1
): ShopCartLine[] {
  const existing = lines.find((line) => line.slug === product.slug)
  const maxQuantity = Math.max(0, Math.floor(Number(product.maxQuantity) || 0))
  if (existing) {
    const quantity = nextAddQuantity(existing.quantity, add, maxQuantity)
    if (quantity < 1) return lines.filter((line) => line.slug !== product.slug)
    return lines.map((line) =>
      line.slug === product.slug ? { ...line, quantity, maxQuantity, displayPrice: product.price } : line
    )
  }
  const quantity = clampCartQuantity(add, maxQuantity)
  if (quantity < 1) return lines
  return [
    ...lines,
    {
      slug: product.slug,
      name: product.name,
      image: product.image,
      displayPrice: product.price,
      sellingQuantity: product.sellingQuantity,
      sellingUnit: product.sellingUnit,
      sellingUnitLabel: product.sellingUnitLabel,
      quantity,
      maxQuantity,
    },
  ]
}

export function applySetQuantity(lines: ShopCartLine[], slug: string, quantity: number): ShopCartLine[] {
  const line = lines.find((item) => item.slug === slug)
  if (!line) return lines
  const next = clampCartQuantity(quantity, line.maxQuantity)
  if (next < 1) return lines.filter((item) => item.slug !== slug)
  return lines.map((item) => (item.slug === slug ? { ...item, quantity: next } : item))
}

export function applyStockLimits(
  lines: ShopCartLine[],
  limits: Array<{ slug: string; maxQuantity: number; price?: number }>
): ShopCartLine[] {
  const bySlug = new Map(limits.map((item) => [item.slug, item]))
  return lines
    .map((line) => {
      const live = bySlug.get(line.slug)
      if (!live) return line
      const maxQuantity = Math.max(0, Math.floor(Number(live.maxQuantity) || 0))
      const quantity = clampCartQuantity(line.quantity, maxQuantity)
      return {
        ...line,
        maxQuantity,
        quantity,
        displayPrice: typeof live.price === 'number' ? live.price : line.displayPrice,
      }
    })
    .filter((line) => line.quantity > 0)
}
