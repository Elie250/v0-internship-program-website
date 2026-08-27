import { getCategories, getPublishedProducts } from '@/lib/platform/queries'
import type { Product } from '@/types/platform'

/** Matches products.low_stock_threshold database default (scripts/10-shop-orders.sql). */
export const DEFAULT_PUBLIC_LOW_STOCK_THRESHOLD = 5

export type PublicAvailability = 'available' | 'few' | 'out'

export type PublicCatalogueCategory = {
  name: string
  slug: string
}

export type PublicCatalogueItem = {
  slug: string
  name: string
  description: string | null
  image: string | null
  price: number
  listPrice: number | null
  discountAmount: number | null
  sellingUnitLabel: string | null
  categoryName: string | null
  categorySlug: string | null
  sku: string | null
  availability: PublicAvailability
  inStock: boolean
  maxQuantity: number
  specifications: Record<string, string>
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SKU_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/

export function isUuidLike(value: string): boolean {
  return UUID_RE.test(value.trim())
}

export function publicAvailability(
  stock: number,
  threshold: number = DEFAULT_PUBLIC_LOW_STOCK_THRESHOLD
): PublicAvailability {
  if (stock <= 0) return 'out'
  if (stock <= threshold) return 'few'
  return 'available'
}

export function publicSellingPrice(price: number, discount: number | null | undefined): number {
  const p = Number(price) || 0
  const d = Number(discount) || 0
  return Math.max(0, Math.round(p - d))
}

const SELLING_UNIT_KEY_RE = /^(unit|selling_unit|sellingUnit|pack_unit|uom)$/i
const SELLING_QTY_KEY_RE = /^(qty|quantity|selling_qty|selling_quantity|pack_size|packSize)$/i
const SELLING_LABEL_KEY_RE = /^(selling_unit_label|pack|contents)$/i

/** Read a selling unit label from product specifications only. Never invent a default unit. */
export function publicSellingUnitLabel(
  specifications: Record<string, string> | null | undefined
): string | null {
  if (!specifications) return null
  const entries = Object.entries(specifications).filter(
    ([key, value]) => key.trim() && String(value).trim()
  )
  const find = (test: RegExp) =>
    entries.find(([key]) => test.test(key.trim()))?.[1]?.trim() || null
  const combined = find(SELLING_LABEL_KEY_RE)
  if (combined) return combined
  const quantity = find(SELLING_QTY_KEY_RE)
  const unit = find(SELLING_UNIT_KEY_RE)
  if (quantity && unit) return `${quantity} ${unit}`.replace(/\s+/g, ' ')
  return unit || quantity
}

export function publicDiscountPercent(
  listPrice: number | null | undefined,
  price: number
): number | null {
  if (listPrice == null || listPrice <= price) return null
  const percent = Math.round((1 - price / listPrice) * 100)
  return percent >= 1 ? percent : null
}

function slugifyName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return slug || 'product'
}

/** Stable opaque token — not a UUID and not shown as an internal id. */
function publicToken(id: string): string {
  let hash = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function publicProductSlug(product: {
  id: string
  name: string
  sku?: string | null
}): string {
  const sku = product.sku?.trim()
  if (sku && SKU_SLUG_RE.test(sku) && !isUuidLike(sku)) return sku
  return `${slugifyName(product.name)}-${publicToken(product.id)}`
}

export function toPublicCatalogueItem(product: Product): PublicCatalogueItem {
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0))
  const threshold =
    product.low_stock_threshold != null
      ? Number(product.low_stock_threshold)
      : DEFAULT_PUBLIC_LOW_STOCK_THRESHOLD
  const availability = publicAvailability(stock, threshold)
  const specifications = product.specifications ?? {}
  const discountAmount = Math.max(0, Math.round(Number(product.discount) || 0))
  const listPrice = Math.max(0, Math.round(Number(product.price) || 0))
  const price = publicSellingPrice(product.price, product.discount)
  const hasRealDiscount = discountAmount > 0 && listPrice > price
  return {
    slug: publicProductSlug(product),
    name: product.name,
    description: product.description?.trim() ? product.description : null,
    image: product.images?.[0] || null,
    price,
    listPrice: hasRealDiscount ? listPrice : null,
    discountAmount: hasRealDiscount ? discountAmount : null,
    sellingUnitLabel: publicSellingUnitLabel(specifications),
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    sku: product.sku?.trim() || null,
    availability,
    inStock: availability !== 'out',
    maxQuantity: stock,
    specifications,
  }
}

export function canAddPublicProductToCart(item: Pick<PublicCatalogueItem, 'inStock' | 'maxQuantity'>): boolean {
  return item.inStock && item.maxQuantity > 0
}

function matchesPublicSearch(item: PublicCatalogueItem, raw: string): boolean {
  const q = raw.trim().toLowerCase()
  if (!q) return true
  return (
    item.name.toLowerCase().includes(q) ||
    (item.sku ?? '').toLowerCase().includes(q) ||
    (item.categoryName ?? '').toLowerCase().includes(q) ||
    (item.description ?? '').toLowerCase().includes(q)
  )
}

export async function loadPublicCatalogue(options?: {
  categorySlug?: string
  search?: string
}): Promise<{
  products: PublicCatalogueItem[]
  categories: PublicCatalogueCategory[]
  error: boolean
}> {
  try {
    const [raw, cats] = await Promise.all([
      getPublishedProducts(),
      getCategories('shop'),
    ])
    const items = raw.map(toPublicCatalogueItem)
    const used = new Set(
      items.map((item) => item.categorySlug).filter((slug): slug is string => Boolean(slug))
    )
    const categories = cats
      .filter((cat) => used.has(cat.slug))
      .map((cat) => ({ name: cat.name, slug: cat.slug }))

    let products = items
    if (options?.categorySlug) {
      products = products.filter((item) => item.categorySlug === options.categorySlug)
    }
    if (options?.search) {
      products = products.filter((item) => matchesPublicSearch(item, options.search as string))
    }
    return { products, categories, error: false }
  } catch {
    return { products: [], categories: [], error: true }
  }
}

export async function getPublicCatalogueItemBySlug(
  slug: string
): Promise<PublicCatalogueItem | null> {
  const identifier = slug.trim()
  if (!identifier || isUuidLike(identifier)) return null
  const { products, error } = await loadPublicCatalogue()
  if (error) return null
  const needle = identifier.toLowerCase()
  return products.find((item) => item.slug.toLowerCase() === needle) ?? null
}
