import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewShopPayment } from '@/src/api/staff'

export function usePaymentReviewMutation(orderId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { decision: 'approve' | 'reject'; adminNotes?: string }) =>
      reviewShopPayment({ orderId, ...input }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
      await client.invalidateQueries({ queryKey: ['staff', 'dashboard'] })
    },
  })
}
