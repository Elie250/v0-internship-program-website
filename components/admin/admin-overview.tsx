import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardList,
  CreditCard,
  Globe,
  GraduationCap,
  HardHat,
  Headphones,
  Megaphone,
  Monitor,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { AdminStats } from '@/app/actions/admin-context'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { AdminNotificationBadge } from '@/components/admin/admin-notification-badge'
import { AdminProgrammeNotifications } from '@/components/admin/admin-programme-notifications'
import type { CourseNotificationRow } from '@/lib/admin/data/course-notification-counts'
import { PERMISSIONS, hasPermission } from '@/lib/admin/permissions'

type ActionAlert = {
  id: string
  title: string
  description: string
  count: number
  href: string
  cta: string
}

type HubCard = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  stat?: string
  alert?: number
}

function buildActionAlerts(stats: AdminStats, permissions: string[]): ActionAlert[] {
  const alerts: ActionAlert[] = []

  if (stats.pendingStaffApprovals > 0 && hasPermission(permissions, PERMISSIONS.USERS_VIEW)) {
    alerts.push({
      id: 'staff',
      title: 'Staff awaiting approval',
      description: 'Lecturer and engineer registrations need review before they can sign in.',
      count: stats.pendingStaffApprovals,
      href: '/admin/dashboard/users?status=pending_approval',
      cta: 'Review accounts',
    })
  }

  if (stats.pendingPayments > 0 && hasPermission(permissions, PERMISSIONS.PAYMENTS_VIEW)) {
    alerts.push({
      id: 'payments',
      title: 'Payments to verify',
      description: 'MTN MoMo receipts submitted by students are waiting for manual approval.',
      count: stats.pendingPayments,
      href: '/admin/dashboard/payments',
      cta: 'Verify payments',
    })
  }

  if (stats.lowStockProducts > 0 && hasPermission(permissions, PERMISSIONS.SHOP_PRODUCTS)) {
    alerts.push({
      id: 'stock',
      title: 'Low stock items',
      description: 'Products at or below their reorder threshold need restocking.',
      count: stats.lowStockProducts,
      href: '/admin/dashboard/stock',
      cta: 'Review inventory',
    })
  }

  return alerts
}

function buildHubs(
  stats: AdminStats,
  permissions: string[],
  courseNotificationTotal?: number
): HubCard[] {
  return [
    hasPermission(permissions, PERMISSIONS.LEARNING_STUDENTS)
      ? {
          id: 'students',
          title: 'Students',
          description: 'Learner accounts, enrollments, and programme progress.',
          icon: GraduationCap,
          href: '/admin/dashboard/students',
          stat: `${stats.students} accounts`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.USERS_VIEW)
      ? {
          id: 'lecturers',
          title: 'Lecturers',
          description: 'Teaching staff and classroom delivery assignments.',
          icon: UserCog,
          href: '/admin/dashboard/lecturers',
          stat: `${stats.lecturers} active`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.USERS_VIEW)
      ? {
          id: 'engineers',
          title: 'Engineers',
          description: 'Support staff, subscriptions, and open tickets.',
          icon: HardHat,
          href: '/admin/dashboard/engineers',
          stat: `${stats.engineers} accounts`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.SHOP_PRODUCTS)
      ? {
          id: 'products-hub',
          title: 'Products & sales',
          description: 'Catalog, POS terminal, orders, and financial overview.',
          icon: ShoppingBag,
          href: '/admin/dashboard/products',
          stat: `${stats.products} products`,
          alert: stats.lowStockProducts > 0 ? stats.lowStockProducts : undefined,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.REPORTS_VIEW)
      ? {
          id: 'financial',
          title: 'Financial overview',
          description: 'Total revenue, e-learning vs products profit.',
          icon: CreditCard,
          href: '/admin/dashboard/financial',
        }
      : null,
    hasPermission(permissions, PERMISSIONS.LEARNING_PROGRAMS)
      ? {
          id: 'courses',
          title: 'Programmes & courses',
          description: 'Create courses, assign lecturers, and manage curriculum.',
          icon: BookOpen,
          href: '/admin/dashboard/courses',
          stat: `${stats.publishedCourses} published`,
          alert: courseNotificationTotal && courseNotificationTotal > 0 ? courseNotificationTotal : undefined,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.LEARNING_PROGRAMS)
      ? {
          id: 'learning-analytics',
          title: 'Learning analytics',
          description: 'Progress, enrollments, and at-risk learners by programme.',
          icon: BookOpen,
          href: '/admin/dashboard/learning-analytics',
        }
      : null,
    hasPermission(permissions, PERMISSIONS.LEARNING_PROGRAMS)
      ? {
          id: 'classroom',
          title: 'Classroom monitor',
          description: 'Upcoming live sessions across all programmes.',
          icon: Monitor,
          href: '/admin/dashboard/classroom',
        }
      : null,
    hasPermission(permissions, PERMISSIONS.CONTENT_ANNOUNCEMENTS)
      ? {
          id: 'public',
          title: 'Public website',
          description: 'Announcements, services, reviews, and site branding.',
          icon: Globe,
          href: '/admin/dashboard/announcements',
          stat: `${stats.announcements} notices`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.APPLICATIONS_VIEW)
      ? {
          id: 'admissions',
          title: 'Admissions',
          description: 'Applications, enrollments, and payment verification.',
          icon: ClipboardList,
          href: '/admin/dashboard/applications',
          stat: `${stats.applications} applications`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.SUPPORT_TICKETS)
      ? {
          id: 'support',
          title: 'Support',
          description: 'Engineering tickets and subscription payments.',
          icon: Headphones,
          href: '/admin/dashboard/support',
          stat: `${stats.supportTickets} tickets`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.LEARNING_STUDENTS)
      ? {
          id: 'certificates',
          title: 'Certificates',
          description: 'Final approval after lecturer confirmation.',
          icon: Award,
          href: '/admin/dashboard/certificates',
          alert: stats.pendingCertificates > 0 ? stats.pendingCertificates : undefined,
        }
      : null,
  ].filter(Boolean) as HubCard[]
}

type MetricCard = {
  label: string
  value: number
  icon: LucideIcon
  hint: string
}

export function AdminOverview({
  stats,
  permissions = [],
  courseNotifications = [],
}: {
  stats: AdminStats
  permissions?: string[]
  courseNotifications?: CourseNotificationRow[]
}) {
  const actionAlerts = buildActionAlerts(stats, permissions)
  const courseNotificationTotal = courseNotifications.reduce(
    (sum, row) => sum + row.notificationCount,
    0
  )
  const hubs = buildHubs(stats, permissions, courseNotificationTotal)

  const cards: MetricCard[] = [
    hasPermission(permissions, PERMISSIONS.USERS_VIEW)
      ? { label: 'Platform users', value: stats.users, icon: Users, hint: `${stats.students} students` }
      : null,
    hasPermission(permissions, PERMISSIONS.LEARNING_STUDENTS)
      ? {
          label: 'Enrollments',
          value: stats.courseEnrollments,
          icon: GraduationCap,
          hint: `${stats.admittedEnrollments} admitted · ${stats.pendingEnrollments} pending`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.PAYMENTS_VIEW)
      ? {
          label: 'Pending payments',
          value: stats.pendingPayments,
          icon: CreditCard,
          hint: `${stats.approvedPaymentsTotal.toLocaleString()} RWF verified`,
        }
      : null,
    hasPermission(permissions, PERMISSIONS.SHOP_PRODUCTS)
      ? {
          label: 'Products catalog',
          value: stats.products,
          icon: ShoppingBag,
          hint:
            stats.lowStockProducts > 0
              ? `${stats.lowStockProducts} low-stock alert${stats.lowStockProducts === 1 ? '' : 's'}`
              : 'Inventory healthy',
        }
      : null,
    hasPermission(permissions, PERMISSIONS.CONTENT_ANNOUNCEMENTS)
      ? {
          label: 'Public content',
          value: stats.announcements,
          icon: Megaphone,
          hint: 'Published announcements',
        }
      : null,
    hasPermission(permissions, PERMISSIONS.USERS_VIEW)
      ? {
          label: 'Staff pipeline',
          value: stats.pendingStaffApprovals,
          icon: ShieldCheck,
          hint: stats.pendingStaffApprovals > 0 ? 'Approvals needed' : 'All staff active',
        }
      : null,
  ].filter(Boolean) as MetricCard[]

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="Dashboard overview"
        description="Monitor students, lecturers, engineers, public content, and shop inventory from one place."
      />

      {actionAlerts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Platform alerts
          </h2>
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-slate-100">
              {actionAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors no-underline"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AdminNotificationBadge count={alert.count} size="sm" />
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {courseNotifications.length > 0 ? (
        <AdminProgrammeNotifications rows={courseNotifications} />
      ) : null}

      {actionAlerts.length === 0 && courseNotificationTotal === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-emerald-800 shrink-0" />
            <p className="text-sm text-slate-900">
              No pending staff approvals, payment verifications, or programme actions.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hubs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Activity areas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {hubs.map((hub) => {
              const Icon = hub.icon
              return (
                <Link key={hub.id} href={hub.href} className="group block">
                  <Card className="h-full border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md hover:border-slate-300">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-navy)]/10">
                          <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
                        </div>
                        {hub.alert ? (
                          <AdminNotificationBadge count={hub.alert} size="sm" />
                        ) : null}
                      </div>
                      <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-[var(--brand-navy)]">
                        {hub.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-slate-700">{hub.description}</p>
                      {hub.stat ? <p className="text-xs font-medium text-slate-600">{hub.stat}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {cards.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Key metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-800">{card.label}</CardTitle>
                    <Icon className="h-4 w-4 text-[var(--brand-navy)]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                    <p className="text-xs text-slate-600 mt-1">{card.hint}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
