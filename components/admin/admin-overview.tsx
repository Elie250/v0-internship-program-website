import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Headphones,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react'
import type { AdminStats } from '@/app/actions/admin-context'

type ActionAlert = {
  id: string
  title: string
  description: string
  count: number
  href: string
  cta: string
}

function buildActionAlerts(stats: AdminStats): ActionAlert[] {
  const alerts: ActionAlert[] = []

  if (stats.pendingStaffApprovals > 0) {
    alerts.push({
      id: 'staff',
      title: 'Staff awaiting approval',
      description: 'Lecturer and engineer registrations need review before they can sign in.',
      count: stats.pendingStaffApprovals,
      href: '/admin/dashboard/users?status=pending_approval',
      cta: 'Review accounts',
    })
  }

  if (stats.pendingPayments > 0) {
    alerts.push({
      id: 'payments',
      title: 'Payments to verify',
      description: 'MTN MoMo receipts submitted by students are waiting for manual approval.',
      count: stats.pendingPayments,
      href: '/admin/dashboard/payments',
      cta: 'Verify payments',
    })
  }

  if (stats.pendingEnrollments > 0) {
    alerts.push({
      id: 'enrollments',
      title: 'Enrollments pending payment',
      description: 'Paid programs with submitted receipts still need enrollment admission.',
      count: stats.pendingEnrollments,
      href: '/admin/dashboard/enrollments',
      cta: 'Manage enrollments',
    })
  }

  return alerts
}

export function AdminOverview({ stats }: { stats: AdminStats }) {
  const actionAlerts = buildActionAlerts(stats)

  const cards = [
    { label: 'Users', value: stats.users, icon: Users, hint: `${stats.students} students` },
    {
      label: 'Course enrollments',
      value: stats.courseEnrollments,
      icon: GraduationCap,
      hint: `${stats.admittedEnrollments} admitted · ${stats.pendingEnrollments} pending payment`,
    },
    {
      label: 'Pending payments',
      value: stats.pendingPayments,
      icon: CreditCard,
      hint: `${stats.approvedPaymentsTotal.toLocaleString()} RWF verified total`,
    },
    {
      label: 'Staff approvals',
      value: stats.pendingStaffApprovals,
      icon: ShieldCheck,
      hint: stats.pendingStaffApprovals > 0 ? 'Action required' : 'All staff accounts active',
    },
    { label: 'Courses', value: stats.courses, icon: BookOpen, hint: `${stats.publishedCourses} published` },
    { label: 'Applications', value: stats.applications, icon: ClipboardList, hint: 'Internship / program applications' },
    { label: 'Products', value: stats.products, icon: ShoppingBag, hint: 'Shop catalog' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, hint: 'Published content' },
    { label: 'Support tickets', value: stats.supportTickets, icon: Headphones, hint: 'Open pipeline' },
  ]

  const quickLinks = [
    { label: 'Programs / Courses', href: '/admin/dashboard/courses' },
    { label: 'All users', href: '/admin/dashboard/users' },
    { label: 'Payment receipts', href: '/admin/dashboard/payments' },
    { label: 'Enrollments', href: '/admin/dashboard/enrollments' },
    { label: 'Settings', href: '/admin/dashboard/settings' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard overview</h1>
        <p className="text-slate-600 mt-1">
          Platform snapshot and items that need your attention.
        </p>
      </div>

      {actionAlerts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Needs attention
          </h2>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {actionAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="border-amber-200 bg-amber-50/80 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {alert.title}
                      </CardTitle>
                    </div>
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-sm font-bold text-amber-950">
                      {alert.count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700">{alert.description}</p>
                  <Button asChild size="sm" variant="outline" className="border-amber-300 bg-white">
                    <Link href={alert.href}>
                      {alert.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-green-700" />
            <p className="text-sm text-slate-800">
              No pending staff approvals, payment verifications, or enrollment holds right now.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Key metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">{card.label}</CardTitle>
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick links
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant="secondary" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
