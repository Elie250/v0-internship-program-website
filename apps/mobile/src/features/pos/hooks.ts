import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPosSale, fetchProducts } from '@/src/api/staff'
import type { PosSaleResult } from '@/src/api/types'
import {
  cartCheckoutItems,
  checkoutFingerprint,
  usePosCart,
} from '@/src/features/pos/cart-store'

export type ProductLookupInput = {
  q?: string
  barcode?: string
  categoryId?: string
}

export function useProductLookup(input: ProductLookupInput, enabled: boolean) {
  return useQuery({
    queryKey: ['staff', 'products', 'lookup', input],
    queryFn: () =>
      fetchProducts({
        q: input.q,
        barcode: input.barcode,
        category_id: input.categoryId,
        limit: 40,
        page: 1,
      }),
    enabled,
  })
}

let inflightCheckout: { fingerprint: string; promise: Promise<PosSaleResult> } | null = null

export function useCreatePosSale() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      paymentMethod: 'cash' | 'momo'
      customerName?: string
      customerPhone?: string | null
    }) => {
      const lines = usePosCart.getState().lines
      const items = cartCheckoutItems(lines)
      const fingerprint = checkoutFingerprint(items, input.paymentMethod)
      if (inflightCheckout && inflightCheckout.fingerprint === fingerprint) {
        return inflightCheckout.promise
      }
      const idempotencyKey = usePosCart.getState().getOrCreateCheckoutKey(fingerprint)
      const promise = createPosSale({
        items,
        paymentMethod: input.paymentMethod,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        idempotencyKey,
      }).finally(() => {
        if (inflightCheckout?.promise === promise) inflightCheckout = null
      })
      inflightCheckout = { fingerprint, promise }
      return promise
    },
    onSuccess: async (result) => {
      if (result.success) {
        usePosCart.getState().clear()
        await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
        await client.invalidateQueries({ queryKey: ['staff', 'dashboard'] })
        await client.invalidateQueries({ queryKey: ['staff', 'inventory'] })
      }
    },
  })
}
