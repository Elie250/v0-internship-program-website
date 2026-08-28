import { QueryClient } from '@tanstack/react-query'

export const staffQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        const status = (error as { status?: number }).status
        if (status && status >= 400 && status < 500) return false
        return count < 2
      },
      staleTime: 15_000,
    },
    mutations: { retry: false },
  },
})

/** Drop cached staff/order/payment data on logout or session expiry. */
export function clearSensitiveStaffCache() {
  staffQueryClient.removeQueries({ queryKey: ['staff'] })
  staffQueryClient.clear()
}
