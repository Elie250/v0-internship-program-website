import { useQuery } from '@tanstack/react-query'
import { fetchPublicCatalogue, fetchPublicProduct } from '@/src/api/public'

export function usePublicCatalogue(params: { category?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['shop', 'catalogue', params.category ?? '', params.q ?? ''],
    queryFn: () => fetchPublicCatalogue(params),
  })
}

export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: ['shop', 'product', slug],
    queryFn: () => fetchPublicProduct(slug),
    enabled: slug.length > 0,
  })
}
