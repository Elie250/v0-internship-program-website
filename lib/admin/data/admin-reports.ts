import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { AdminStats } from '@/app/actions/admin-context'
import { queryCourseNotificationRows } from '@/lib/admin/data/course-notification-counts'

export type CourseStatusBreakdown = {
  draft: number
  pendingReview: number
  published: number
  archived: number
  other: number
}

export type ProgrammeNotificationSummary = {
  total: number
  coursesNeedingAttention: number
  pendingReviewCourses: number
  draftCourses: number
  pendingEnrollments: number
  pendingCertificates: number
}

export type ContentReportSummary = {
  libraryTotal: number
  libraryPublished: number
  libraryPendingReview: number
  engineeringArticlesTotal: number
  engineeringArticlesPublished: number
}

export type AdminReportData = {
  stats: AdminStats
  coursesByStatus: CourseStatusBreakdown
  programmeNotifications: ProgrammeNotificationSummary
  content: ContentReportSummary
}

const EMPTY_COURSE_STATUS: CourseStatusBreakdown = {
  draft: 0,
  pendingReview: 0,
  published: 0,
  archived: 0,
  other: 0,
}

const EMPTY_PROGRAMME_NOTIFICATIONS: ProgrammeNotificationSummary = {
  total: 0,
  coursesNeedingAttention: 0,
  pendingReviewCourses: 0,
  draftCourses: 0,
  pendingEnrollments: 0,
  pendingCertificates: 0,
}

const EMPTY_CONTENT: ContentReportSummary = {
  libraryTotal: 0,
  libraryPublished: 0,
  libraryPendingReview: 0,
  engineeringArticlesTotal: 0,
  engineeringArticlesPublished: 0,
}

export function emptyAdminReportData(stats: AdminStats): AdminReportData {
  return {
    stats,
    coursesByStatus: { ...EMPTY_COURSE_STATUS },
    programmeNotifications: { ...EMPTY_PROGRAMME_NOTIFICATIONS },
    content: { ...EMPTY_CONTENT },
  }
}

async function countCoursesByStatus(): Promise<CourseStatusBreakdown> {
  const empty: CourseStatusBreakdown = {
    draft: 0,
    pendingReview: 0,
    published: 0,
    archived: 0,
    other: 0,
  }

  if (!supabaseAdmin) return empty

  const { data, error } = await supabaseAdmin.from('courses').select('status, is_published')
  if (error || !data) return empty

  const breakdown = { ...empty }

  for (const row of data) {
    const status = String(row.status ?? '')
    if (status === 'published' || (status === '' && row.is_published === true)) {
      breakdown.published += 1
    } else if (status === 'pending_review') {
      breakdown.pendingReview += 1
    } else if (status === 'archived') {
      breakdown.archived += 1
    } else if (status === 'draft' || status === '') {
      breakdown.draft += 1
    } else {
      breakdown.other += 1
    }
  }

  return breakdown
}

async function countTableSafe(table: string): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) {
    if (error.message.includes(table)) return 0
    return 0
  }
  return count ?? 0
}

async function countByStatusSafe(table: string, status: string): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('status', status)
  if (error) {
    if (error.message.includes(table)) return 0
    return 0
  }
  return count ?? 0
}

function buildProgrammeNotificationSummary(
  rows: Awaited<ReturnType<typeof queryCourseNotificationRows>>['rows']
): ProgrammeNotificationSummary {
  let coursesNeedingAttention = 0
  let pendingReviewCourses = 0
  let draftCourses = 0
  let pendingEnrollments = 0
  let pendingCertificates = 0
  let total = 0

  for (const row of rows) {
    total += row.notificationCount
    if (row.notificationCount > 0) coursesNeedingAttention += 1
    if (row.status === 'pending_review') pendingReviewCourses += 1
    if (row.status === 'draft') draftCourses += 1
    pendingEnrollments += row.pendingEnrollments
    pendingCertificates += row.pendingCertificates
  }

  return {
    total,
    coursesNeedingAttention,
    pendingReviewCourses,
    draftCourses,
    pendingEnrollments,
    pendingCertificates,
  }
}

export async function queryAdminReportData(stats: AdminStats): Promise<AdminReportData> {
  const [coursesByStatus, courseNotifications, contentCounts] = await Promise.all([
    countCoursesByStatus(),
    queryCourseNotificationRows(),
    Promise.all([
      countTableSafe('energy_library_items'),
      countByStatusSafe('energy_library_items', 'published'),
      countByStatusSafe('energy_library_items', 'pending_review'),
      countTableSafe('engineering_articles'),
      countByStatusSafe('engineering_articles', 'published'),
    ]),
  ])

  const [libraryTotal, libraryPublished, libraryPendingReview, engineeringArticlesTotal, engineeringArticlesPublished] =
    contentCounts

  return {
    stats,
    coursesByStatus,
    programmeNotifications: buildProgrammeNotificationSummary(courseNotifications.rows),
    content: {
      libraryTotal,
      libraryPublished,
      libraryPendingReview,
      engineeringArticlesTotal,
      engineeringArticlesPublished,
    },
  }
}
