import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/lib/shop/public-catalogue'

export const NEW_ARRIVALS_LIMIT = 8
export const FEATURED_LIMIT = 4
export const HERO_LIMIT = 5
export const DEALS_LIMIT = 8

export type StorefrontPromoKind = 'sound' | 'power'

export type StorefrontPromo = {
  kind: StorefrontPromoKind
  categoryName: string
  categorySlug: string
  image: string | null
}

export type StorefrontCategoryTile = {
  name: string
  slug: string
  image: string | null
  productCount: number
}

export type StorefrontMerchandising = {
  heroProducts: PublicCatalogueItem[]
  newArrivals: PublicCatalogueItem[]
  featured: PublicCatalogueItem[]
  deals: PublicCatalogueItem[]
  promos: StorefrontPromo[]
  categoryTiles: StorefrontCategoryTile[]
}

const SOUND_RE = /audio|sound|headphone|earphone|earbud|speaker|music/i
const POWER_RE = /charg|batter|power|cable|adapter|usb/i

function categoryText(category: PublicCatalogueCategory): string {
  return `${category.slug} ${category.name}`
}

function firstImageInCategory(
  products: PublicCatalogueItem[],
  slug: string
): string | null {
  return products.find((item) => item.categorySlug === slug && item.image)?.image ?? null
}

function uniqueBySlug(
  items: PublicCatalogueItem[],
  limit: number,
  seen: Set<string>
): PublicCatalogueItem[] {
  const selected: PublicCatalogueItem[] = []
  for (const item of items) {
    if (selected.length >= limit) break
    const slug = item.slug.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    selected.push(item)
  }
  return selected
}

export function selectNewArrivals(
  products: PublicCatalogueItem[],
  limit: number = NEW_ARRIVALS_LIMIT
): PublicCatalogueItem[] {
  return products.slice(0, Math.max(0, limit))
}

/** Newest published products with photos, preferring items currently in stock. */
export function selectHeroProducts(
  products: PublicCatalogueItem[],
  limit: number = HERO_LIMIT
): PublicCatalogueItem[] {
  const cap = Math.max(1, Math.min(5, limit))
  const seen = new Set<string>()
  const inStockWithImage = products.filter((item) => item.inStock && Boolean(item.image))
  const selected = uniqueBySlug(inStockWithImage, cap, seen)
  if (selected.length < 3) {
    const withImage = products.filter((item) => Boolean(item.image))
    selected.push(...uniqueBySlug(withImage, cap - selected.length, seen))
  }
  return selected
}

export function selectDealProducts(
  products: PublicCatalogueItem[],
  limit: number = DEALS_LIMIT
): PublicCatalogueItem[] {
  return products
    .filter(
      (item) =>
        (item.discountAmount ?? 0) > 0 &&
        item.listPrice != null &&
        item.listPrice > item.price
    )
    .slice(0, Math.max(0, limit))
}

export function selectFeaturedProducts(
  products: PublicCatalogueItem[],
  newArrivals: PublicCatalogueItem[],
  limit: number = FEATURED_LIMIT
): PublicCatalogueItem[] {
  const newest = new Set(newArrivals.map((item) => item.slug))
  const withPhoto = products.filter((item) => item.inStock && Boolean(item.image))
  const rest = withPhoto.filter((item) => !newest.has(item.slug))
  const picked = (rest.length >= 2 ? rest : withPhoto).slice(0, Math.max(0, limit))
  const arrivalSlugs = newArrivals.map((item) => item.slug).join('|')
  const featuredSlugs = picked.map((item) => item.slug).join('|')
  if (picked.length === 0) return []
  if (featuredSlugs === arrivalSlugs) return []
  if (newArrivals.length <= limit && picked.every((item) => newest.has(item.slug))) return []
  return picked
}

export function selectPromoCollections(
  products: PublicCatalogueItem[],
  categories: PublicCatalogueCategory[]
): StorefrontPromo[] {
  const used = new Set<string>()
  const promos: StorefrontPromo[] = []

  const take = (kind: StorefrontPromoKind, test: RegExp) => {
    const category = categories.find(
      (entry) => !used.has(entry.slug) && test.test(categoryText(entry))
    )
    if (!category) return
    const inCategory = products.filter((item) => item.categorySlug === category.slug)
    if (inCategory.length === 0) return
    used.add(category.slug)
    promos.push({
      kind,
      categoryName: category.name,
      categorySlug: category.slug,
      image: firstImageInCategory(products, category.slug),
    })
  }

  take('sound', SOUND_RE)
  take('power', POWER_RE)
  return promos
}

export function selectCategoryTiles(
  products: PublicCatalogueItem[],
  categories: PublicCatalogueCategory[]
): StorefrontCategoryTile[] {
  return categories
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      image: firstImageInCategory(products, category.slug),
      productCount: products.filter((item) => item.categorySlug === category.slug).length,
    }))
    .filter((tile) => tile.productCount > 0)
}

/** Derive homepage merchandising from the published catalogue. No extra tables or featured column. */
export function buildStorefrontMerchandising(
  products: PublicCatalogueItem[],
  categories: PublicCatalogueCategory[]
): StorefrontMerchandising {
  const newArrivals = selectNewArrivals(products)
  return {
    heroProducts: selectHeroProducts(products),
    newArrivals,
    featured: selectFeaturedProducts(products, newArrivals),
    deals: selectDealProducts(products),
    promos: selectPromoCollections(products, categories),
    categoryTiles: selectCategoryTiles(products, categories),
  }
}
