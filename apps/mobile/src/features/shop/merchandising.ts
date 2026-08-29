import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/src/api/public-types'

const LATEST_LIMIT = 8
const TRENDS_LIMIT = 4
const DEALS_LIMIT = 8

/** Client-only grouping. Does not invent products or change prices. */
export function latestArrivals(products: PublicCatalogueItem[]) {
  return products
}

/** Photographed Latest Arrivals only — the home hero slides these, not a single featured pick. */
export function selectHeroSlides(latest: PublicCatalogueItem[]): PublicCatalogueItem[] {
  return latest.filter((item) => Boolean(item.image))
}

function slugSet(items: PublicCatalogueItem[]) {
  return new Set(items.map((item) => item.slug))
}

function uniqueBySlug(items: PublicCatalogueItem[], limit: number, seen: Set<string>) {
  const selected: PublicCatalogueItem[] = []
  for (const item of items) {
    if (selected.length >= limit) break
    if (!item.slug || seen.has(item.slug)) continue
    seen.add(item.slug)
    selected.push(item)
  }
  return selected
}

export function hasRealDiscount(item: PublicCatalogueItem): boolean {
  return (item.discountAmount ?? 0) > 0 && item.listPrice != null && item.listPrice > item.price
}

export function selectDealProducts(products: PublicCatalogueItem[], limit = DEALS_LIMIT) {
  return products.filter((item) => hasRealDiscount(item)).slice(0, Math.max(0, limit))
}

export function selectLatestProducts(
  products: PublicCatalogueItem[],
  heroProducts: PublicCatalogueItem[],
  limit = LATEST_LIMIT
) {
  const heroSlugs = slugSet(heroProducts)
  const rest = uniqueBySlug(
    products.filter((item) => !heroSlugs.has(item.slug)),
    Math.max(0, limit),
    new Set()
  )
  if (rest.length > 0) return rest
  if (products.length === 1) return uniqueBySlug(products, 1, new Set())
  return []
}

export function trendingProducts(
  products: PublicCatalogueItem[],
  excluded: PublicCatalogueItem[] = [],
  limit = TRENDS_LIMIT
) {
  const skip = slugSet(excluded)
  const featured = products.filter((item) => item.featured && !skip.has(item.slug))
  if (featured.length > 0) return featured.slice(0, limit)
  return products.filter((item) => !skip.has(item.slug)).slice(0, limit)
}

export function moreInShop(products: PublicCatalogueItem[], excluded: PublicCatalogueItem[]) {
  const skip = slugSet(excluded)
  return products.filter((item) => !skip.has(item.slug))
}

export function categoryCover(
  category: PublicCatalogueCategory,
  products: PublicCatalogueItem[]
): string | null {
  return (
    products.find((item) => item.categorySlug === category.slug && item.image)?.image ?? null
  )
}

export function sortProducts(
  products: PublicCatalogueItem[],
  sort: 'name' | 'price_asc' | 'price_desc'
) {
  const copy = [...products]
  if (sort === 'price_asc') return copy.sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return copy.sort((a, b) => b.price - a.price)
  return copy.sort((a, b) => a.name.localeCompare(b.name))
}
