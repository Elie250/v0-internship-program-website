'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { filterAdminNav, type AdminNavGroup } from '@/lib/admin/nav'
import {
  PERMISSIONS,
  type Permission,
  canAccessAdminPanel,
  hasPermission,
  resolvePermissions,
} from '@/lib/admin/permissions'
import { getCurrentUser } from '@/app/actions/auth-service'

export type AdminStats = {
  users: number
  courses: number
  announcements: number
  applications: number
  products: number
  supportTickets: number
}

export type AdminSession = {
  user: {
    id: string
    email: string
    role: string
    firstName?: string
    lastName?: string
    permissions: string[]
  }
  nav: AdminNavGroup[]
}

async function countTable(table: string): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) return 0
  return count ?? 0
}

async function fetchAdminStats(): Promise<AdminStats> {
  const [users, courses, announcements, applications, products, supportTickets] =
    await Promise.all([
      countTable('users'),
      countTable('courses'),
      countTable('announcements'),
      countTable('applications'),
      countTable('products'),
      countTable('support_tickets'),
    ])

  return { users, courses, announcements, applications, products, supportTickets }
}

/** Single auth + nav resolution for admin layouts (uses session cookie permissions). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const user = await getCurrentUser()
  if (!user?.id || !user?.role) return null

  const permissions = resolvePermissions(user.role, user.permissions)
  if (!canAccessAdminPanel(user.role, permissions)) return null

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions,
    },
    nav: filterAdminNav(permissions),
  }
}

/** Batched stats — all table counts in one parallel batch. */
export async function getAdminStats(): Promise<AdminStats> {
  const session = await getAdminSession()
  if (!session || !supabaseAdmin) {
    return {
      users: 0,
      courses: 0,
      announcements: 0,
      applications: 0,
      products: 0,
      supportTickets: 0,
    }
  }

  return fetchAdminStats()
}

/** Overview payload: auth + nav + stats with minimal duplicate work. */
export async function getAdminOverview() {
  const session = await getAdminSession()
  if (!session || !supabaseAdmin) return null

  const stats = await fetchAdminStats()
  return { ...session, stats }
}

export async function requireAdminPermission(
  permission: Permission
): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  if (!hasPermission(session.user.permissions, permission)) {
    throw new Error('Forbidden')
  }
  return session
}

export async function requireAdminAccess(): Promise<AdminSession> {
  return requireAdminPermission(PERMISSIONS.ADMIN_ACCESS)
}
