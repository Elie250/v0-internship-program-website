import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOrder, fetchOrders, updateOrderFulfillment } from '@/src/api/staff'

export function useOrdersQuery(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['staff', 'orders', params],
    queryFn: () => fetchOrders(params),
  })
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['staff', 'orders', id],
    queryFn: () => fetchOrder(id!),
    enabled: Boolean(id),
  })
}

export const FULFILLMENT_STATUSES = [
  'confirmed',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
] as const

export function fulfillmentLabel(status: string | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'confirmed':
      return 'Order confirmed'
    case 'ready_for_pickup':
      return 'Ready for pickup'
    case 'out_for_delivery':
      return 'Out for delivery'
    case 'completed':
      return 'Completed'
    case 'cancelled':
    case 'canceled':
      return 'Cancelled'
    default:
      return status || '—'
  }
}

export function paymentLabel(status: string | null | undefined): string {
  switch (status) {
    case 'pending_review':
      return 'Payment awaiting confirmation'
    case 'paid':
    case 'approved':
      return 'Paid'
    case 'rejected':
      return 'Payment rejected'
    case 'unpaid':
      return 'Unpaid'
    default:
      return status || '—'
  }
}

export function isPendingPayment(status: string | null | undefined): boolean {
  return ['pending_review', 'gateway_pending', 'pending', 'Pending'].includes(String(status ?? ''))
}

/** Pending shop MoMo from web checkout or Android POS — not cash, not channel-gated. */
export function needsShopPaymentReview(order: {
  paymentStatus?: string | null
  paymentMethod?: string | null
  payment?: { status?: string | null } | null
}): boolean {
  if (order.paymentMethod === 'cash') return false
  return isPendingPayment(order.paymentStatus) || isPendingPayment(order.payment?.status)
}

export function useFulfillmentMutation(orderId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => updateOrderFulfillment(orderId, status),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['staff', 'orders'] })
    },
  })
}
