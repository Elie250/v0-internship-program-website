import { useSessionStore } from '@/src/auth/session-store'

/**
 * Leave staff for the guest shop without a full logout.
 * Lock the staff session so the next person cannot open POS from history.
 */
export async function leaveStaffForShop(router: { replace: (href: '/customer') => void }) {
  const { token, locked, lock } = useSessionStore.getState()
  if (token && !locked) await lock()
  router.replace('/customer')
}
