import { getPublishedProducts } from '@/lib/platform/queries'
import {
  canAddPublicProductToCart,
  isUuidLike,
  publicProductSlug,
  toPublicCatalogueItem,
} from '@/lib/shop/public-catalogue'

export const PUBLIC_CHECKOUT_CART_CHANGED = 'CART_CHANGED'

export const PUBLIC_CART_CHANGED_MESSAGE =
  'Prices or availability changed. Please review your cart.'

export type PublicCheckoutLineInput = {
  slug?: unknown
  productId?: unknown
  quantity?: unknown
  quotedUnitPrice?: unknown
}

export type ResolvedCheckoutLine = {
  productId: string
  quantity: number
}

export type PublicCheckoutResolveResult =
  | { ok: true; usedPublicSlugs: boolean; items: ResolvedCheckoutLine[] }
  | { ok: false; code: 'EMPTY' | 'INVALID' | typeof PUBLIC_CHECKOUT_CART_CHANGED }

export function quotedUnitPriceMatches(quoted: unknown, serverPrice: number): boolean {
  if (quoted == null || quoted === '') return true
  const n = Number(quoted)
  if (!Number.isFinite(n)) return false
  return Math.round(n) === Math.round(serverPrice)
}

export function usesPublicCheckoutSlugs(items: PublicCheckoutLineInput[]): boolean {
  return items.some((item) => typeof item.slug === 'string' && item.slug.trim().length > 0)
}

function parseQuantity(raw: unknown): number | null {
  const quantity = Math.floor(Number(raw))
  if (!Number.isFinite(quantity) || quantity < 1) return null
  return quantity
}

/**
 * Resolve customer cart lines to internal product IDs.
 * Public slugs are matched to published products; client UUIDs, prices, and
 * stock figures are never used as commerce authority.
 */
export async function resolvePublicCheckoutItems(
  rawItems: unknown
): Promise<PublicCheckoutResolveResult> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, code: 'EMPTY' }
  }

  const rows = rawItems as PublicCheckoutLineInput[]
  const usedPublicSlugs = usesPublicCheckoutSlugs(rows)

  if (!usedPublicSlugs) {
    const items: ResolvedCheckoutLine[] = []
    for (const row of rows) {
      const productId = String(row.productId ?? '').trim()
      const quantity = parseQuantity(row.quantity)
      if (!productId || !quantity) return { ok: false, code: 'INVALID' }
      items.push({ productId, quantity })
    }
    return { ok: true, usedPublicSlugs: false, items }
  }

  let published
  try {
    published = await getPublishedProducts()
  } catch {
    return { ok: false, code: PUBLIC_CHECKOUT_CART_CHANGED }
  }

  const bySlug = new Map(
    published.map((product) => [publicProductSlug(product).toLowerCase(), product])
  )

  const items: ResolvedCheckoutLine[] = []
  for (const row of rows) {
    const slug = String(row.slug ?? '').trim()
    const quantity = parseQuantity(row.quantity)
    if (!slug || !quantity || isUuidLike(slug)) {
      return { ok: false, code: PUBLIC_CHECKOUT_CART_CHANGED }
    }

    const product = bySlug.get(slug.toLowerCase())
    if (!product) return { ok: false, code: PUBLIC_CHECKOUT_CART_CHANGED }

    const publicItem = toPublicCatalogueItem(product)
    if (!canAddPublicProductToCart(publicItem) || quantity > publicItem.maxQuantity) {
      return { ok: false, code: PUBLIC_CHECKOUT_CART_CHANGED }
    }
    if (!quotedUnitPriceMatches(row.quotedUnitPrice, publicItem.price)) {
      return { ok: false, code: PUBLIC_CHECKOUT_CART_CHANGED }
    }

    items.push({ productId: product.id, quantity })
  }

  return { ok: true, usedPublicSlugs: true, items }
}

export function toPublicShopOrderResponse(input: {
  orderNumber: string
  totalAmount: number
  shopName: string
  fulfillmentType: 'pickup' | 'delivery'
}): {
  success: true
  orderNumber: string
  totalAmount: number
  shopName: string
  status: 'pending'
  paymentStatus: 'pending'
  message: string
} {
  return {
    success: true,
    orderNumber: input.orderNumber,
    totalAmount: input.totalAmount,
    shopName: input.shopName,
    status: 'pending',
    paymentStatus: 'pending',
    message:
      input.fulfillmentType === 'delivery'
        ? 'Order submitted. We will verify your MoMo payment and contact you for delivery.'
        : 'Order submitted. We will verify your MoMo payment and notify you when ready for pickup.',
  }
}
