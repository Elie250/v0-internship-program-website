import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AdminNotificationBadge } from '@/components/admin/admin-notification-badge'
import type { CourseNotificationRow } from '@/lib/admin/data/course-notification-counts'
import { courseNotificationLabel } from '@/lib/admin/course-notifications'

function statusHint(row: CourseNotificationRow): string {
  const parts: string[] = []
  if (row.status === 'pending_review') parts.push('lecturer submission')
  if (row.status === 'draft') parts.push('unpublished draft')
  if (row.pendingEnrollments > 0) {
    parts.push(`${row.pendingEnrollments} enrollment${row.pendingEnrollments === 1 ? '' : 's'}`)
  }
  if (row.pendingCertificates > 0) {
    parts.push(`${row.pendingCertificates} certificate${row.pendingCertificates === 1 ? '' : 's'}`)
  }
  return parts.join(' · ')
}

export function AdminProgrammeNotifications({ rows }: { rows: CourseNotificationRow[] }) {
  if (rows.length === 0) return null

  const withAlerts = rows.filter((row) => row.notificationCount > 0)
  const total = withAlerts.reduce((sum, row) => sum + row.notificationCount, 0)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Programme notifications
        </h2>
        {total > 0 ? (
          <AdminNotificationBadge count={total} size="sm" className="ring-slate-100" />
        ) : null}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0 divide-y divide-slate-100">
          {rows.map((row) => (
            <Link
              key={row.courseId}
              href="/admin/dashboard/courses"
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors no-underline"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{row.title}</p>
                {row.notificationCount > 0 ? (
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{statusHint(row)}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">No pending actions</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {row.notificationCount > 0 ? (
                  <AdminNotificationBadge count={row.notificationCount} size="sm" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-200" aria-hidden />
                )}
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {withAlerts.length > 0 ? (
        <p className="text-xs text-slate-600">
          {courseNotificationLabel(total)} across {withAlerts.length} programme
          {withAlerts.length === 1 ? '' : 's'}. Open Programmes &amp; courses to resolve.
        </p>
      ) : null}
    </section>
  )
}
