import { requireAdminPermission, type AdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

/** Roles that deliver programmes via /lecturer — never the full admin console. */
export const DELIVERY_ROLES = new Set(['lecturer', 'instructor', 'mentor'])

export function isDeliveryRole(role: string | undefined): boolean {
  return Boolean(role && DELIVERY_ROLES.has(role))
}

export function isPlatformAdminRole(role: string | undefined): boolean {
  return role === 'admin'
}

/** Course ownership, instructor assignment, delete, and other platform-wide changes. */
export async function requirePlatformAdmin(): Promise<AdminSession> {
  const session = await requireAdminPermission(PERMISSIONS.ADMIN_ACCESS)
  if (!isPlatformAdminRole(session.user.role)) {
    throw new Error('Forbidden — administrator access only')
  }
  return session
}
