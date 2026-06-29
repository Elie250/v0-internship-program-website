'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentUser } from '@/app/actions/auth-service'

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
  lessons: StudentLesson[]
}

export type StudentEnrollmentPending = {
  id: string
  courseTitle: string
  status: string
  amountDue: number
  createdAt: string
}

export type StudentPortalData = {
  user: { firstName?: string; lastName?: string; email: string }
  admittedCourses: StudentCourse[]
  pendingEnrollments: StudentEnrollmentPending[]
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

export async function getStudentPortalData(): Promise<
  { success: true; data: StudentPortalData } | { success: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user?.email) {
    return { success: false, error: 'Please log in to access your learning portal.' }
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Learning portal is temporarily unavailable.' }
  }

  const email = String(user.email).trim()

  const { data: enrollments, error: enrollError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status, amount_due, created_at, course_id, course:courses(id, title, description, thumbnail, duration, difficulty)')
    .ilike('applicant_email', email)
    .order('created_at', { ascending: false })

  if (enrollError) {
    return { success: false, error: enrollError.message }
  }

  const rows = enrollments ?? []
  const admittedRows = rows.filter((r) => r.status === 'admitted')
  const pendingRows = rows.filter((r) =>
    ['payment_pending_review', 'applied', 'pending_payment'].includes(String(r.status))
  )

  const courseIds = admittedRows.map((r) => r.course_id).filter(Boolean)
  let lessons: StudentLesson[] = []

  if (courseIds.length) {
    const { data: content } = await supabaseAdmin
      .from('course_content')
      .select('id, course_id, title, content_type, content_url, sort_order')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true })

    lessons = (content ?? []) as StudentLesson[]
  }

  const admittedCourses: StudentCourse[] = admittedRows
    .map((row) => {
      const course = row.course as {
        id: string
        title: string
        description: string | null
        thumbnail: string | null
        duration: string | null
        difficulty: string | null
      } | null
      if (!course) return null
      return {
        enrollmentId: row.id,
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        duration: course.duration,
        difficulty: course.difficulty,
        lessons: lessons.filter((l) => l.course_id === course.id),
      }
    })
    .filter((c): c is StudentCourse => c !== null)

  let webinars: StudentPortalData['webinars'] = []
  if (admittedCourses.length) {
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

  return {
    success: true,
    data: {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      admittedCourses,
      pendingEnrollments: pendingRows.map((row) => ({
        id: row.id,
        courseTitle: (row.course as { title?: string } | null)?.title ?? 'Course',
        status: row.status,
        amountDue: Number(row.amount_due ?? 0),
        createdAt: row.created_at,
      })),
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
  const course = portal.data.admittedCourses.find((c) => c.id === courseId)
  if (!course) {
    return { success: false as const, error: 'Course not available. Payment must be approved first.' }
  }
  return { success: true as const, data: course, user: portal.data.user }
}
