import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getStaffSessionFromToken,
  type StaffAuthUser,
} from '@/lib/staff/auth'
import { readStaffSessionCookie } from '@/lib/staff/session-cookie'
import { isShopHost } from '@/lib/shop/hosts'
import { hasPermission, type Permission } from '@/lib/admin/permissions'

export type ShopPortalSession = {
  sessionId: string
  user: StaffAuthUser
}

/** True when the current request Host is the Shop management portal. */
export async function isCurrentRequestShopHost(): Promise<boolean> {
  const headerStore = await headers()
  return isShopHost(headerStore.get('host'))
}

/**
 * Load the authenticated shop staff session from the httpOnly cookie.
 * Does not create sessions — login must use POST /api/staff/auth.
 */
export async function getShopPortalSession(): Promise<ShopPortalSession | null> {
  const token = await readStaffSessionCookie()
  if (!token) return null
  const result = await getStaffSessionFromToken(token)
  if (!result.session) return null
  return result.session
}

export async function requireShopPortalSession(
  returnTo?: string
): Promise<ShopPortalSession> {
  const session = await getShopPortalSession()
  if (session) return session
  const params = new URLSearchParams()
  if (returnTo) params.set('returnTo', returnTo)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  redirect(`/login${suffix}`)
}

/**
 * Require auth + at least one of the listed permissions.
 * Returns null when authenticated but lacking permission (caller renders forbidden UI).
 */
export async function requireShopPortalAccess(
  returnTo: string,
  required: Permission | Permission[] | null
): Promise<ShopPortalSession | null> {
  const session = await requireShopPortalSession(returnTo)
  if (!required) return session
  if (!hasPermission(session.user.permissions, required)) return null
  return session
}
