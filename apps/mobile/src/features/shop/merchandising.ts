import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/src/api/public-types'

/** Client-only grouping. Does not invent products or change prices. */
export function latestArrivals(products: PublicCatalogueItem[]) {
  return products
}

/** Photographed Latest Arrivals only — the home hero slides these, not a single featured pick. */
export function selectHeroSlides(latest: PublicCatalogueItem[]): PublicCatalogueItem[] {
  return latest.filter((item) => Boolean(item.image))
}

export function trendingProducts(products: PublicCatalogueItem[]) {
  const featured = products.filter((item) => item.featured)
  return featured.length > 0 ? featured : products.slice(0, 8)
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
