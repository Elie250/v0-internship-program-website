'use server'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { filterAdminNav, type AdminNavGroup } from '@/lib/admin/nav'
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  type Permission,
  canAccessAdminPanel,
  hasPermission,
  resolvePermissions,
} from '@/lib/admin/permissions'
import { getCurrentUser } from '@/app/actions/auth-service'
import { repairEnrollmentsWithApprovedPayments } from '@/lib/enrollment/repair-approved-payments'

export type AdminStats = {
  users: number
  students: number
  courses: number
  publishedCourses: number
  announcements: number
  applications: number
  products: number
  supportTickets: number
  courseEnrollments: number
  admittedEnrollments: number
  pendingEnrollments: number
  pendingPayments: number
  pendingStaffApprovals: number
  approvedPaymentsTotal: number
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

async function countPublishedCourses(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { data, error } = await supabaseAdmin.from('courses').select('status, is_published')
  if (error || !data) return 0
  return data.filter((row) => {
    if (row.status === 'published') return true
    if (row.status == null && row.is_published === true) return true
    return false
  }).length
}

async function countEnrollmentsByStatus(status?: string): Promise<number> {
  if (!supabaseAdmin) return 0
  let query = supabaseAdmin.from('course_enrollments').select('*', { count: 'exact', head: true })
  if (status) query = query.eq('status', status)
  const { count, error } = await query
  if (error) return 0
  return count ?? 0
}

async function countPendingEnrollments(): Promise<number> {
  if (!supabaseAdmin) return 0

  const { data: rows, error } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, payment_id')
    .eq('status', 'payment_pending_review')

  if (error || !rows?.length) return 0

  const paymentIds = rows.map((r) => r.payment_id).filter(Boolean) as string[]
  if (!paymentIds.length) return rows.length

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .in('id', paymentIds)

  const approvedIds = new Set(
    (payments ?? [])
      .filter((p) => p.status === 'approved' || p.status === 'Paid')
      .map((p) => p.id)
  )

  return rows.filter((row) => !row.payment_id || !approvedIds.has(row.payment_id as string)).length
}

async function countPendingPayments(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending_review', 'Pending', 'pending'])
  if (error) return 0
  return count ?? 0
}

async function sumApprovedPayments(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .in('status', ['approved', 'Paid'])
  if (error || !data) return 0
  return data.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
}

async function countStudents(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('role', ['student', 'registered'])
  if (error) return 0
  return count ?? 0
}

async function countPendingStaffApprovals(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval')
  if (error) return 0
  return count ?? 0
}

async function fetchAdminStats(): Promise<AdminStats> {
  await repairEnrollmentsWithApprovedPayments()

  const [
    users,
    students,
    courses,
    publishedCourses,
    announcements,
    applications,
    products,
    supportTickets,
    courseEnrollments,
    admittedEnrollments,
    pendingEnrollments,
    pendingPayments,
    pendingStaffApprovals,
    approvedPaymentsTotal,
  ] = await Promise.all([
    countTable('users'),
    countStudents(),
    countTable('courses'),
    countPublishedCourses(),
    countTable('announcements'),
    countTable('applications'),
    countTable('products'),
    countTable('support_tickets'),
    countEnrollmentsByStatus(),
    countEnrollmentsByStatus('admitted'),
    countPendingEnrollments(),
    countPendingPayments(),
    countPendingStaffApprovals(),
    sumApprovedPayments(),
  ])

  return {
    users,
    students,
    courses,
    publishedCourses,
    announcements,
    applications,
    products,
    supportTickets,
    courseEnrollments,
    admittedEnrollments,
    pendingEnrollments,
    pendingPayments,
    pendingStaffApprovals,
    approvedPaymentsTotal,
  }
}

/** Single auth + nav resolution (user_session or legacy admin_session). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const user = await getCurrentUser()

  if (user?.id && user?.role) {
    const permissions = resolvePermissions(user.role, user.permissions)
    if (canAccessAdminPanel(user.role, permissions)) {
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
  }

  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')
  if (adminSession?.value === 'authenticated') {
    const permissions = [...ALL_PERMISSIONS]
    return {
      user: {
        id: 'legacy-admin',
        email: 'admin@energyandlogics.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: '',
        permissions,
      },
      nav: filterAdminNav(permissions),
    }
  }

  return null
}

/** Batched stats — all table counts in one parallel batch. */
export async function getAdminStats(): Promise<AdminStats> {
  const session = await getAdminSession()
  if (!session || !supabaseAdmin) {
    return {
      users: 0,
      students: 0,
      courses: 0,
      publishedCourses: 0,
      announcements: 0,
      applications: 0,
      products: 0,
      supportTickets: 0,
      courseEnrollments: 0,
      admittedEnrollments: 0,
      pendingEnrollments: 0,
      pendingPayments: 0,
      pendingStaffApprovals: 0,
      approvedPaymentsTotal: 0,
    }
  }

  return fetchAdminStats()
}

/** Overview payload: auth + nav + stats (stats load even for legacy admin session). */
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
