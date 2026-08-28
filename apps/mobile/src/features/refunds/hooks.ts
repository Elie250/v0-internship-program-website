import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decideShopRefund, requestShopRefund } from '@/src/api/staff'

let inflightRefund: { fingerprint: string; promise: Promise<unknown> } | null = null

export function useRequestShopRefund(orderId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      items: Array<{ orderItemId: string; quantity: number }>
      reason: string
      notes?: string
      idempotencyKey: string
      fingerprint: string
    }) => {
      if (inflightRefund && inflightRefund.fingerprint === input.fingerprint) {
        return inflightRefund.promise as ReturnType<typeof requestShopRefund>
      }
      const promise = requestShopRefund({
        orderId,
        items: input.items,
        reason: input.reason,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
      }).finally(() => {
        if (inflightRefund?.promise === promise) inflightRefund = null
      })
      inflightRefund = { fingerprint: input.fingerprint, promise }
      return promise
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
      await client.invalidateQueries({ queryKey: ['staff', 'dashboard'] })
    },
  })
}

export function useDecideShopRefund() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      refundId: string
      decision: 'approve' | 'reject'
      notes?: string
      idempotencyKey: string
    }) => decideShopRefund(input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
      await client.invalidateQueries({ queryKey: ['staff', 'dashboard'] })
    },
  })
}
