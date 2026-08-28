import { ReactNode } from 'react'
import { Redirect } from 'expo-router'
import { useSessionStore } from '@/src/auth/session-store'
import { canSeeStaffNavItem, STAFF_NAV_ITEMS, type StaffNavKey } from '@/src/permissions'

/** Hide-tab is not security — block deep links to screens the user cannot use. */
export function RequireStaffNav({
  navKey,
  children,
}: {
  navKey: StaffNavKey
  children: ReactNode
}) {
  const user = useSessionStore((s) => s.user)
  const item = STAFF_NAV_ITEMS.find((entry) => entry.key === navKey)
  if (!item || !canSeeStaffNavItem(user?.permissions, item)) {
    return <Redirect href="/staff" />
  }
  return <>{children}</>
}
