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
import { countActionablePendingEnrollments } from '@/lib/enrollment/actionable-pending'
import {
  queryCourseNotificationRows,
  type CourseNotificationRow,
} from '@/lib/admin/data/course-notification-counts'
import {
  emptyAdminReportData,
  queryAdminReportData,
  type AdminReportData,
} from '@/lib/admin/data/admin-reports'

export type AdminStats = {
  users: number
  students: number
  lecturers: number
  engineers: number
  courses: number
  publishedCourses: number
  announcements: number
  applications: number
  products: number
  lowStockProducts: number
  supportTickets: number
  courseEnrollments: number
  admittedEnrollments: number
  pendingEnrollments: number
  pendingPayments: number
  pendingStaffApprovals: number
  pendingCertificates: number
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
  return countActionablePendingEnrollments()
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

async function countUsersByRoles(roles: string[]): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('role', roles)
  if (error) return 0
  return count ?? 0
}

async function countLowStockProducts(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('stock, low_stock_threshold')
    .eq('status', 'active')
  if (error || !data) return 0
  return data.filter((row) => {
    const stock = Number(row.stock ?? 0)
    const threshold = Number(row.low_stock_threshold ?? 5)
    return stock > 0 && stock <= threshold
  }).length
}

async function countPendingCertificates(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('student_certificates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_admin')
  if (error) {
    if (error.message.includes('student_certificates')) return 0
    return 0
  }
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
    lecturers,
    engineers,
    courses,
    publishedCourses,
    announcements,
    applications,
    products,
    lowStockProducts,
    supportTickets,
    courseEnrollments,
    admittedEnrollments,
    pendingEnrollments,
    pendingPayments,
    pendingStaffApprovals,
    pendingCertificates,
    approvedPaymentsTotal,
  ] = await Promise.all([
    countTable('users'),
    countUsersByRoles(['student', 'registered']),
    countUsersByRoles(['lecturer', 'instructor']),
    countUsersByRoles(['engineer']),
    countTable('courses'),
    countPublishedCourses(),
    countTable('announcements'),
    countTable('applications'),
    countTable('products'),
    countLowStockProducts(),
    countTable('support_tickets'),
    countEnrollmentsByStatus(),
    countEnrollmentsByStatus('admitted'),
    countPendingEnrollments(),
    countPendingPayments(),
    countPendingStaffApprovals(),
    countPendingCertificates(),
    sumApprovedPayments(),
  ])

  return {
    users,
    students,
    lecturers,
    engineers,
    courses,
    publishedCourses,
    announcements,
    applications,
    products,
    lowStockProducts,
    supportTickets,
    courseEnrollments,
    admittedEnrollments,
    pendingEnrollments,
    pendingPayments,
    pendingStaffApprovals,
    pendingCertificates,
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
      lecturers: 0,
      engineers: 0,
      courses: 0,
      publishedCourses: 0,
      announcements: 0,
      applications: 0,
      products: 0,
      lowStockProducts: 0,
      supportTickets: 0,
      courseEnrollments: 0,
      admittedEnrollments: 0,
      pendingEnrollments: 0,
      pendingPayments: 0,
      pendingStaffApprovals: 0,
      pendingCertificates: 0,
      approvedPaymentsTotal: 0,
    }
  }

  return fetchAdminStats()
}

/** Internal report builder for cron jobs (no session required). */
export async function buildAdminReportDataInternal(): Promise<AdminReportData> {
  const emptyStats: AdminStats = {
    users: 0,
    students: 0,
    lecturers: 0,
    engineers: 0,
    courses: 0,
    publishedCourses: 0,
    announcements: 0,
    applications: 0,
    products: 0,
    lowStockProducts: 0,
    supportTickets: 0,
    courseEnrollments: 0,
    admittedEnrollments: 0,
    pendingEnrollments: 0,
    pendingPayments: 0,
    pendingStaffApprovals: 0,
    pendingCertificates: 0,
    approvedPaymentsTotal: 0,
  }

  try {
    const stats = await fetchAdminStats()
    if (!supabaseAdmin) return emptyAdminReportData(stats)
    return await queryAdminReportData(stats)
  } catch {
    return emptyAdminReportData(emptyStats)
  }
}

/** Batched report payload aligned with dashboard stats and programme notifications. */
export async function getAdminReportData(): Promise<AdminReportData> {
  const session = await getAdminSession()
  const emptyStats: AdminStats = {
    users: 0,
    students: 0,
    lecturers: 0,
    engineers: 0,
    courses: 0,
    publishedCourses: 0,
    announcements: 0,
    applications: 0,
    products: 0,
    lowStockProducts: 0,
    supportTickets: 0,
    courseEnrollments: 0,
    admittedEnrollments: 0,
    pendingEnrollments: 0,
    pendingPayments: 0,
    pendingStaffApprovals: 0,
    pendingCertificates: 0,
    approvedPaymentsTotal: 0,
  }

  if (!session) {
    return emptyAdminReportData(emptyStats)
  }

  try {
    const stats = await fetchAdminStats()
    if (!supabaseAdmin) {
      return emptyAdminReportData(stats)
    }
    return await queryAdminReportData(stats)
  } catch (error) {
    console.error('[admin] getAdminReportData failed:', error)
    try {
      const stats = await fetchAdminStats()
      return emptyAdminReportData(stats)
    } catch {
      return emptyAdminReportData(emptyStats)
    }
  }
}

/** Overview payload: auth + nav + stats (stats load even for legacy admin session). */
export async function getAdminOverview() {
  const session = await getAdminSession()
  if (!session || !supabaseAdmin) return null

  const [stats, courseNotifications] = await Promise.all([
    fetchAdminStats(),
    hasPermission(session.user.permissions, PERMISSIONS.LEARNING_PROGRAMS)
      ? queryCourseNotificationRows()
      : Promise.resolve({ rows: [] as CourseNotificationRow[], totalNotifications: 0 }),
  ])

  return {
    ...session,
    stats,
    courseNotifications: courseNotifications.rows,
    courseNotificationTotal: courseNotifications.totalNotifications,
  }
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

export async function getAdminNavBadges(permissions: string[]): Promise<Record<string, number>> {
  const badges: Record<string, number> = {}

  if (hasPermission(permissions, PERMISSIONS.LEARNING_PROGRAMS)) {
    const { totalNotifications } = await queryCourseNotificationRows()
    if (totalNotifications > 0) {
      badges.courses = totalNotifications
    }
  }

  return badges
}

export async function requireAdminAccess(): Promise<AdminSession> {
  return requireAdminPermission(PERMISSIONS.ADMIN_ACCESS)
}
