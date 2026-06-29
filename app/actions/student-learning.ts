'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  formatAccessDate,
  getEnrollmentAccessState,
  isContentUnlocked,
  type EnrollmentAccessRow,
} from '@/lib/enrollment/access'
import {
  ENROLLMENT_STATUS_LABELS,
  ACCESS_STATE_LABELS,
  PENDING_ENROLLMENT_STATUSES,
  type AccessState,
} from '@/lib/enrollment/constants'

export type StudentLesson = {
  id: string
  course_id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
}

export type StudentCourse = {
  enrollmentId: string
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: string | null
  difficulty: string | null
  accessState: AccessState
  accessStartsAt: string | null
  accessEndsAt: string | null
  accessLabel: string
  lessons: StudentLesson[]
}

export type StudentEnrollmentItem = {
  id: string
  courseTitle: string
  status: string
  statusLabel: string
  accessState: AccessState
  accessLabel: string
  amountDue: number
  createdAt: string
  accessStartsAt: string | null
  accessEndsAt: string | null
}

export type StudentPortalData = {
  user: { firstName?: string; lastName?: string; email: string; phone?: string | null }
  activeCourses: StudentCourse[]
  upcomingCourses: StudentCourse[]
  expiredCourses: StudentCourse[]
  pendingEnrollments: StudentEnrollmentItem[]
  rejectedEnrollments: StudentEnrollmentItem[]
  webinars: Array<{
    id: string
    title: string
    description: string | null
    scheduled_at: string | null
    meeting_link: string | null
    recording_url: string | null
  }>
  announcements: Array<{
    id: string
    title: string
    message: string
    created_at: string
  }>
}

type JoinedCourse = {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: string | null
  difficulty: string | null
}

function normalizeJoinedCourse(course: JoinedCourse | JoinedCourse[] | null | undefined): JoinedCourse | null {
  if (!course) return null
  if (Array.isArray(course)) return course[0] ?? null
  return course
}

function accessLabelFor(state: AccessState, startsAt?: string | null, endsAt?: string | null): string {
  if (state === 'upcoming' && startsAt) return `Access opens ${formatAccessDate(startsAt)}`
  if (state === 'active' && endsAt) return `Access until ${formatAccessDate(endsAt)}`
  if (state === 'expired' && endsAt) return `Access ended ${formatAccessDate(endsAt)}`
  return ACCESS_STATE_LABELS[state]
}

function buildStudentCourse(
  row: {
    id: string
    course_id: string
    access_starts_at?: string | null
    access_ends_at?: string | null
    status: string
    course: JoinedCourse | JoinedCourse[] | null
  },
  lessons: StudentLesson[]
): StudentCourse | null {
  const course = normalizeJoinedCourse(row.course)
  if (!course) return null

  const accessRow: EnrollmentAccessRow = {
    status: row.status,
    access_starts_at: row.access_starts_at,
    access_ends_at: row.access_ends_at,
  }
  const accessState = getEnrollmentAccessState(accessRow)

  return {
    enrollmentId: row.id,
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    duration: course.duration,
    difficulty: course.difficulty,
    accessState,
    accessStartsAt: row.access_starts_at ?? null,
    accessEndsAt: row.access_ends_at ?? null,
    accessLabel: accessLabelFor(accessState, row.access_starts_at, row.access_ends_at),
    lessons: isContentUnlocked(accessRow) ? lessons.filter((l) => l.course_id === course.id) : [],
  }
}

export async function getStudentPortalData(): Promise<
  { success: true; data: StudentPortalData } | { success: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user?.email || !user?.id) {
    return { success: false, error: 'Please log in to access your learning portal.' }
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Learning portal is temporarily unavailable.' }
  }

  const email = String(user.email).trim()
  const userId = String(user.id)

  const { data: byUserId, error: byUserError } = await supabaseAdmin
    .from('course_enrollments')
    .select(
      'id, status, amount_due, created_at, course_id, access_starts_at, access_ends_at, course:courses(id, title, description, thumbnail, duration, difficulty)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: byEmailOnly, error: byEmailError } = await supabaseAdmin
    .from('course_enrollments')
    .select(
      'id, status, amount_due, created_at, course_id, access_starts_at, access_ends_at, course:courses(id, title, description, thumbnail, duration, difficulty)'
    )
    .ilike('applicant_email', email)
    .is('user_id', null)
    .order('created_at', { ascending: false })

  if (byUserError || byEmailError) {
    return { success: false, error: byUserError?.message ?? byEmailError?.message ?? 'Failed to load enrollments' }
  }

  const seen = new Set<string>()
  const rows = [...(byUserId ?? []), ...(byEmailOnly ?? [])].filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })

  const pendingRows = rows.filter((r) =>
    PENDING_ENROLLMENT_STATUSES.includes(String(r.status) as (typeof PENDING_ENROLLMENT_STATUSES)[number])
  )
  const rejectedRows = rows.filter((r) => r.status === 'payment_rejected')

  const admittedRows = rows.filter((r) => r.status === 'admitted')
  const activeAdmittedIds = admittedRows
    .filter((r) =>
      isContentUnlocked({
        status: r.status,
        access_starts_at: r.access_starts_at,
        access_ends_at: r.access_ends_at,
      })
    )
    .map((r) => r.course_id)
    .filter(Boolean)

  let lessons: StudentLesson[] = []
  if (activeAdmittedIds.length) {
    const { data: content } = await supabaseAdmin
      .from('course_content')
      .select('id, course_id, title, content_type, content_url, sort_order')
      .in('course_id', activeAdmittedIds)
      .order('sort_order', { ascending: true })

    lessons = (content ?? []) as StudentLesson[]
  }

  const allCourses = admittedRows
    .map((row) => buildStudentCourse(row as Parameters<typeof buildStudentCourse>[0], lessons))
    .filter((c): c is StudentCourse => c !== null)

  const activeCourses = allCourses.filter((c) => c.accessState === 'active')
  const upcomingCourses = allCourses.filter((c) => c.accessState === 'upcoming')
  const expiredCourses = allCourses.filter((c) => c.accessState === 'expired')

  let webinars: StudentPortalData['webinars'] = []
  if (activeCourses.length) {
    const { data } = await supabaseAdmin
      .from('webinars')
      .select('id, title, description, scheduled_at, meeting_link, recording_url')
      .eq('status', 'published')
      .order('scheduled_at', { ascending: true })
    webinars = data ?? []
  }

  const { data: announcements } = await supabaseAdmin
    .from('announcements')
    .select('id, title, message, content, created_at')
    .or('status.eq.published,is_featured.eq.true')
    .order('created_at', { ascending: false })
    .limit(8)

  let phone: string | null = null
  const { data: userRow } = await supabaseAdmin.from('users').select('phone').eq('id', userId).maybeSingle()
  phone = userRow?.phone ?? null

  const mapEnrollmentItem = (row: (typeof rows)[0]): StudentEnrollmentItem => {
    const accessRow: EnrollmentAccessRow = {
      status: row.status,
      access_starts_at: row.access_starts_at,
      access_ends_at: row.access_ends_at,
    }
    const accessState = getEnrollmentAccessState(accessRow)
    return {
      id: row.id,
      courseTitle: normalizeJoinedCourse(row.course as JoinedCourse | JoinedCourse[] | null)?.title ?? 'Course',
      status: row.status,
      statusLabel: ENROLLMENT_STATUS_LABELS[row.status] ?? row.status,
      accessState,
      accessLabel: accessLabelFor(accessState, row.access_starts_at, row.access_ends_at),
      amountDue: Number(row.amount_due ?? 0),
      createdAt: row.created_at,
      accessStartsAt: row.access_starts_at ?? null,
      accessEndsAt: row.access_ends_at ?? null,
    }
  }

  return {
    success: true,
    data: {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone,
      },
      activeCourses,
      upcomingCourses,
      expiredCourses,
      pendingEnrollments: pendingRows.map(mapEnrollmentItem),
      rejectedEnrollments: rejectedRows.map(mapEnrollmentItem),
      webinars,
      announcements: (announcements ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message ?? a.content ?? '',
        created_at: a.created_at,
      })),
    },
  }
}

export async function getStudentCourse(courseId: string) {
  const portal = await getStudentPortalData()
  if (!portal.success) return portal
  const course = portal.data.activeCourses.find((c) => c.id === courseId)
  if (!course) {
    const upcoming = portal.data.upcomingCourses.find((c) => c.id === courseId)
    if (upcoming) {
      return {
        success: false as const,
        error: `This course opens on ${formatAccessDate(upcoming.accessStartsAt)}. Check back then.`,
      }
    }
    return { success: false as const, error: 'Course not available. Payment must be approved first.' }
  }
  return { success: true as const, data: course, user: portal.data.user }
}
