import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicCatalogue, fetchPublicOrder, fetchPublicProduct } from '@/src/api/public'
import { useShopCart } from '@/src/features/shop/cart-store'

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

export function usePublicOrder(ref: string) {
  return useQuery({
    queryKey: ['shop', 'order', ref],
    queryFn: () => fetchPublicOrder(ref),
    enabled: ref.length > 0,
  })
}

export function useSyncCartStock() {
  const applyLiveStock = useShopCart((s) => s.applyLiveStock)
  const query = usePublicCatalogue()
  useEffect(() => {
    if (query.data?.products) applyLiveStock(query.data.products)
  }, [applyLiveStock, query.data?.products])
  return query
}
