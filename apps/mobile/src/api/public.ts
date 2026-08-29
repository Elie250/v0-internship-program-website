import { ApiError, getApiBaseUrl, publicRequest } from '@/src/api/client'
import { sanitizeApiErrorMessage } from '@/src/api/errors'
import type { PublicAvailability, PublicCatalogueCategory, PublicCatalogueItem } from '@/src/api/public-types'

const AVAILABILITY: ReadonlySet<string> = new Set(['available', 'few', 'out'])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function payloadError(): ApiError {
  return new ApiError(
    sanitizeApiErrorMessage({ status: 500, code: 'invalid_payload' }),
    500,
    'invalid_payload'
  )
}

/** Make relative storefront image paths loadable in React Native. */
export function resolvePublicImageUrl(image: string | null | undefined): string | null {
  const raw = typeof image === 'string' ? image.trim() : ''
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return `${getApiBaseUrl()}${raw}`
  return raw
}

function parseAvailability(value: unknown, inStock: boolean): PublicAvailability {
  if (typeof value === 'string' && AVAILABILITY.has(value)) {
    return value as PublicAvailability
  }
  return inStock ? 'available' : 'out'
}

export function parsePublicCatalogueItem(value: unknown): PublicCatalogueItem | null {
  const row = asRecord(value)
  if (!row) return null
  const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  const price = typeof row.price === 'number' && Number.isFinite(row.price) ? row.price : NaN
  if (!slug || !name || !Number.isFinite(price)) return null

  const sellingQuantity =
    typeof row.sellingQuantity === 'number' && row.sellingQuantity > 0 ? row.sellingQuantity : 1
  const sellingUnit = typeof row.sellingUnit === 'string' && row.sellingUnit.trim()
    ? row.sellingUnit.trim()
    : 'PCS'
  const sellingUnitLabel =
    typeof row.sellingUnitLabel === 'string' && row.sellingUnitLabel.trim()
      ? row.sellingUnitLabel.trim()
      : `${sellingQuantity} ${sellingUnit}`

  const inStock = row.inStock !== false && row.availability !== 'out'
  const availability = parseAvailability(row.availability, inStock)

  return {
    slug,
    name,
    description: typeof row.description === 'string' ? row.description : null,
    image: resolvePublicImageUrl(typeof row.image === 'string' ? row.image : null),
    price,
    listPrice: typeof row.listPrice === 'number' ? row.listPrice : null,
    discountAmount: typeof row.discountAmount === 'number' ? row.discountAmount : null,
    sellingQuantity,
    sellingUnit,
    sellingUnitLabel,
    categoryName: typeof row.categoryName === 'string' ? row.categoryName : null,
    categorySlug: typeof row.categorySlug === 'string' ? row.categorySlug : null,
    sku: typeof row.sku === 'string' ? row.sku : null,
    availability,
    inStock: availability !== 'out',
    maxQuantity: typeof row.maxQuantity === 'number' && row.maxQuantity >= 0 ? row.maxQuantity : 0,
    featured: row.featured === true,
  }
}

function parseCategory(value: unknown): PublicCatalogueCategory | null {
  const row = asRecord(value)
  if (!row) return null
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
  if (!name || !slug) return null
  return { name, slug }
}

export function parsePublicCatalogue(data: unknown): {
  products: PublicCatalogueItem[]
  categories: PublicCatalogueCategory[]
} {
  const row = asRecord(data)
  if (!row || !Array.isArray(row.products) || !Array.isArray(row.categories)) {
    throw payloadError()
  }
  const products = row.products
    .map(parsePublicCatalogueItem)
    .filter((item): item is PublicCatalogueItem => item != null)
  const categories = row.categories
    .map(parseCategory)
    .filter((item): item is PublicCatalogueCategory => item != null)
  return { products, categories }
}

export async function fetchPublicCatalogue(params: { category?: string; q?: string } = {}) {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  const data = await publicRequest<unknown>(`/api/shop/catalogue${suffix}`)
  return parsePublicCatalogue(data)
}

export async function fetchPublicProduct(slug: string) {
  const data = await publicRequest<unknown>(`/api/shop/catalogue/${encodeURIComponent(slug)}`)
  const row = asRecord(data)
  const item = parsePublicCatalogueItem(row?.item)
  if (!item) throw payloadError()
  return { item }
}
