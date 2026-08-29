import { publicRequest } from '@/src/api/client'
import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/src/api/public-types'

export async function fetchPublicCatalogue(params: { category?: string; q?: string } = {}) {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return publicRequest<{
    products: PublicCatalogueItem[]
    categories: PublicCatalogueCategory[]
  }>(`/api/shop/catalogue${suffix}`)
}

export async function fetchPublicProduct(slug: string) {
  return publicRequest<{ item: PublicCatalogueItem }>(
    `/api/shop/catalogue/${encodeURIComponent(slug)}`
  )
}
