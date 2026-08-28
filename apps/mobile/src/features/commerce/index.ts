import { useQuery } from '@tanstack/react-query'
import { fetchDashboard, fetchOrders } from '@/src/api/staff'

export function useDashboardQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['staff', 'dashboard'],
    queryFn: fetchDashboard,
    enabled,
  })
}

export function usePendingMomoCount(enabled: boolean) {
  return useQuery({
    queryKey: ['staff', 'orders', 'pending-momo-count'],
    queryFn: async () => {
      const result = await fetchOrders({
        channel: 'online',
        payment_status: 'pending_review',
        page: 1,
        limit: 1,
      })
      return result.total
    },
    enabled,
  })
}
