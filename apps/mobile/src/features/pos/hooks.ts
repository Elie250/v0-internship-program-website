import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPosSale, fetchProducts } from '@/src/api/staff'
import { cartCheckoutItems, usePosCart } from '@/src/features/pos/cart-store'

export type ProductLookupInput = {
  q?: string
  barcode?: string
}

export function useProductLookup(input: ProductLookupInput, enabled: boolean) {
  return useQuery({
    queryKey: ['staff', 'products', 'lookup', input],
    queryFn: () =>
      fetchProducts({
        q: input.q,
        barcode: input.barcode,
        limit: 25,
        page: 1,
      }),
    enabled,
  })
}

export function useCreatePosSale() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      paymentMethod: 'cash' | 'momo'
      customerName?: string
      customerPhone?: string | null
    }) => {
      const lines = usePosCart.getState().lines
      const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      return createPosSale({
        items: cartCheckoutItems(lines),
        paymentMethod: input.paymentMethod,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        idempotencyKey,
      })
    },
    onSuccess: async (result) => {
      if (result.success) {
        usePosCart.getState().clear()
        await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
        await client.invalidateQueries({ queryKey: ['staff', 'dashboard'] })
      }
    },
  })
}
