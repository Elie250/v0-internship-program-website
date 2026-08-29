export type PublicAvailability = 'available' | 'few' | 'out'

export type PublicCatalogueCategory = {
  name: string
  slug: string
}

/** Public storefront product. No cost, staff permissions, or internal UUID. */
export type PublicCatalogueItem = {
  slug: string
  name: string
  description: string | null
  image: string | null
  price: number
  listPrice: number | null
  discountAmount: number | null
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  categoryName: string | null
  categorySlug: string | null
  sku: string | null
  availability: PublicAvailability
  inStock: boolean
  maxQuantity: number
  featured: boolean
}
