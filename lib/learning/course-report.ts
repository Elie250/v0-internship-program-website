import { getCurrentUser } from '@/app/actions/auth-service'
import { getEnrollmentAccessState } from '@/lib/enrollment/access'
import { decideProgrammeReportAccess } from '@/lib/learning/course-report-access'
import {
  planReportCurriculumFallback,
  selectPublishedReportLessons,
} from '@/lib/learning/course-report-curriculum'
import {
  editorialProfileFromRow,
  readPublicationStatus,
  studentVisibleEditorialProfile,
  type ReportPublicationStatus,
} from '@/lib/learning/course-report-publication'
import { formatPlatformDateTime, PLATFORM_TIMEZONE } from '@/lib/platform/rwanda-datetime'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type CourseReportProfile = {
  overview: string | null
  purpose: string | null
  targetAudience: string | null
  entryRequirements: string | null
  learningObjectives: string | null
  learningOutcomes: string | null
  deliveryMethod: string | null
  workloadDescription: string | null
  assessmentDescription: string | null
  certificationDescription: string | null
  additionalInformation: string | null
}

export type CourseReportLesson = {
  id: string
  title: string
}

export type CourseReportModule = {
  id: string
  title: string
  lessons: CourseReportLesson[]
}

export type CourseReportSession = {
  id: string
  topic: string
  scheduledAt: string | null
  scheduledLabel: string
  durationMinutes: number | null
  location: string | null
  meetingLink: string | null
  recordingUrl: string | null
}

export type CourseReportAssessment = {
  id: string
  title: string
  passingScore: number | null
}

export type CourseReportCertificate = {
  code: string
  issuedAt: string | null
  programTitle: string
}

export type CourseReportTrainer = {
  name: string
  title: string | null
  bio: string | null
  photoUrl: string | null
}

export type CourseReport = {
  courseId: string
  title: string
  description: string | null
  thumbnail: string | null
  categoryName: string | null
  duration: string | null
  pricing: number | null
  profile: CourseReportProfile | null
  modules: CourseReportModule[]
  ungroupedLessons: CourseReportLesson[]
  trainer: CourseReportTrainer | null
  assessments: CourseReportAssessment[]
  certificate: CourseReportCertificate | null
  enrollment: {
    id: string
    amountDue: number | null
    accessStartsAt: string | null
    accessEndsAt: string | null
    accessState: 'upcoming' | 'active' | 'expired'
  }
  sessions: CourseReportSession[]
  hideLiveAccess: boolean
}

export type CourseReportResult =
  | { ok: true; report: CourseReport }
  | { ok: false; status: 'unauthenticated' | 'forbidden' | 'unavailable'; message: string }

const ADMITTED = 'admitted'
const PROFILE_COLUMNS =
  'overview, purpose, target_audience, entry_requirements, learning_objectives, learning_outcomes, delivery_method, workload_description, assessment_description, certification_description, additional_information, publication_status'

export type CourseReportPreview = {
  report: CourseReport
  publicationStatus: ReportPublicationStatus
}

export { decideProgrammeReportAccess }

function blank(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text ? text : null
}

function isMissingRelation(message: string): boolean {
  return /relation .* does not exist|could not find the table|schema cache/i.test(message)
}

function reportLessonTitles(
  rows: Array<{ id: unknown; title?: unknown; visibility?: unknown }>
): CourseReportLesson[] {
  const safe = selectPublishedReportLessons(rows)
  if (
    rows.length > 0 &&
    safe.length === 0 &&
    rows.some((row) => !Object.prototype.hasOwnProperty.call(row, 'visibility'))
  ) {
    console.warn(
      '[course-report] Returning an empty curriculum because lesson rows did not include visibility.'
    )
  }
  return safe.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? 'Lesson'),
  }))
}

function formatReportDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    timeZone: PLATFORM_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatReportAccessDate(iso: string | null): string {
  return formatReportDate(iso)
}

function profileStorageMessage(message: string): string | null {
  if (isMissingRelation(message) || /publication_status/i.test(message)) {
    return 'Programme report storage is not ready. Run scripts/97-course-report-profiles.sql and scripts/98-course-report-publication.sql.'
  }
  return null
}

async function loadProfile(
  courseId: string,
  audience: 'student' | 'admin'
): Promise<{ profile: CourseReportProfile | null; publicationStatus: ReportPublicationStatus; storageError: string | null }> {
  if (!supabaseAdmin) {
    return { profile: null, publicationStatus: 'draft', storageError: null }
  }
  const { data, error } = await supabaseAdmin
    .from('course_report_profiles')
    .select(PROFILE_COLUMNS)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) {
    const storageError = profileStorageMessage(error.message)
    if (storageError) {
      if (audience === 'student') {
        console.warn('[course-report] Hiding editorial profile because publication status could not be verified:', error.message)
        return { profile: null, publicationStatus: 'draft', storageError: null }
      }
      return { profile: null, publicationStatus: 'draft', storageError }
    }
    throw new Error(error.message)
  }

  const row = (data ?? null) as Record<string, unknown> | null
  const publicationStatus = readPublicationStatus(row?.publication_status)
  const profile = audience === 'student' ? studentVisibleEditorialProfile(row) : row ? editorialProfileFromRow(row) : null
  return { profile, publicationStatus, storageError: null }
}

async function loadCurriculum(courseId: string): Promise<{
  modules: CourseReportModule[]
  ungroupedLessons: CourseReportLesson[]
}> {
  if (!supabaseAdmin) return { modules: [], ungroupedLessons: [] }

  const lessonsResult = await supabaseAdmin
    .from('course_content')
    .select('id, title, sort_order, visibility, module_id')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (lessonsResult.error) {
    const plan = planReportCurriculumFallback(lessonsResult.error.message)
    if (plan === 'throw') throw new Error(lessonsResult.error.message)
    if (plan === 'empty') {
      console.warn(
        '[course-report] Returning an empty curriculum because lesson publication status could not be verified:',
        lessonsResult.error.message
      )
      return { modules: [], ungroupedLessons: [] }
    }

    const fallback = await supabaseAdmin
      .from('course_content')
      .select('id, title, sort_order, visibility')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
    if (fallback.error) {
      const retry = planReportCurriculumFallback(fallback.error.message)
      if (retry === 'throw') throw new Error(fallback.error.message)
      console.warn(
        '[course-report] Returning an empty curriculum because lesson publication status could not be verified:',
        fallback.error.message
      )
      return { modules: [], ungroupedLessons: [] }
    }
    return {
      modules: [],
      ungroupedLessons: reportLessonTitles(fallback.data ?? []),
    }
  }

  const published = selectPublishedReportLessons(lessonsResult.data ?? [])

  const moduleIds = [
    ...new Set(
      published
        .map((row) => (row as { module_id?: string | null }).module_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const moduleTitles = new Map<string, { title: string; sort: number }>()
  if (moduleIds.length) {
    const modulesResult = await supabaseAdmin
      .from('course_modules')
      .select('id, title, sort_order')
      .in('id', moduleIds)
    if (!modulesResult.error) {
      for (const row of modulesResult.data ?? []) {
        moduleTitles.set(String(row.id), {
          title: String(row.title ?? 'Module'),
          sort: Number(row.sort_order ?? 0),
        })
      }
    }
  }

  const grouped = new Map<string, CourseReportLesson[]>()
  const ungroupedLessons: CourseReportLesson[] = []
  for (const row of published) {
    const lesson = { id: String(row.id), title: String(row.title ?? 'Lesson') }
    const moduleId = (row as { module_id?: string | null }).module_id
    if (moduleId && moduleTitles.has(String(moduleId))) {
      const key = String(moduleId)
      grouped.set(key, [...(grouped.get(key) ?? []), lesson])
    } else {
      ungroupedLessons.push(lesson)
    }
  }

  const modules = [...grouped.entries()]
    .map(([id, lessons]) => ({
      id,
      title: moduleTitles.get(id)?.title ?? 'Module',
      sort: moduleTitles.get(id)?.sort ?? 0,
      lessons,
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ id, title, lessons }) => ({ id, title, lessons }))

  return { modules, ungroupedLessons }
}

async function loadTrainer(instructorId: string | null): Promise<CourseReportTrainer | null> {
  if (!supabaseAdmin || !instructorId) return null
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name, profile_title, profile_bio, profile_photo_url, show_on_team')
    .eq('id', instructorId)
    .maybeSingle()

  if (error || !data || data.show_on_team !== true) return null

  const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
  if (!name) return null

  return {
    name,
    title: blank(data.profile_title),
    bio: blank(data.profile_bio),
    photoUrl: blank(data.profile_photo_url),
  }
}

async function loadAssessments(courseId: string): Promise<CourseReportAssessment[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('course_assessments')
    .select('id, title, passing_score, sort_order, is_published')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (error) {
    if (isMissingRelation(error.message) || /is_published/i.test(error.message)) {
      const basic = await supabaseAdmin
        .from('course_assessments')
        .select('id, title, passing_score, sort_order')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true })
      if (basic.error) return []
      return (basic.data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title ?? 'Assessment'),
        passingScore: row.passing_score == null ? null : Number(row.passing_score),
      }))
    }
    return []
  }

  return (data ?? [])
    .filter((row) => row.is_published !== false)
    .map((row) => ({
      id: String(row.id),
      title: String(row.title ?? 'Assessment'),
      passingScore: row.passing_score == null ? null : Number(row.passing_score),
    }))
}

async function loadCertificate(
  userId: string,
  courseId: string
): Promise<CourseReportCertificate | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('student_certificates')
    .select('certificate_code, issued_at, program_title')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.certificate_code) return null
  return {
    code: String(data.certificate_code),
    issuedAt: data.issued_at ? String(data.issued_at) : null,
    programTitle: String(data.program_title ?? ''),
  }
}

async function loadSessions(courseId: string, hideLiveAccess: boolean): Promise<CourseReportSession[]> {
  if (!supabaseAdmin) return []
  const full = await supabaseAdmin
    .from('course_sessions')
    .select('id, topic, scheduled_at, duration_minutes, location, meeting_link, recording_url')
    .eq('course_id', courseId)
    .order('scheduled_at', { ascending: true })

  const rows = full.error
    ? (
        await supabaseAdmin
          .from('course_sessions')
          .select('id, topic, scheduled_at, duration_minutes, location, meeting_link')
          .eq('course_id', courseId)
          .order('scheduled_at', { ascending: true })
      ).data
    : full.data

  return (rows ?? []).map((row) => {
    const scheduledAt = row.scheduled_at ? String(row.scheduled_at) : null
    return {
      id: String(row.id),
      topic: String(row.topic ?? 'Session'),
      scheduledAt,
      scheduledLabel: scheduledAt ? formatPlatformDateTime(scheduledAt) : '',
      durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
      location: blank(row.location),
      meetingLink: hideLiveAccess ? null : blank(row.meeting_link),
      recordingUrl: hideLiveAccess ? null : blank((row as { recording_url?: string | null }).recording_url),
    }
  })
}

export async function loadStudentCourseReport(courseId: string): Promise<CourseReportResult> {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { ok: false, status: 'unauthenticated', message: 'Please log in to view this programme report.' }
  }
  if (!['student', 'applicant', 'registered'].includes(String(user.role ?? ''))) {
    return { ok: false, status: 'forbidden', message: 'Student access only.' }
  }
  if (!supabaseAdmin) {
    return { ok: false, status: 'unavailable', message: 'Programme reports are temporarily unavailable.' }
  }

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, user_id, status, course_id, amount_due, access_starts_at, access_ends_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', ADMITTED)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (enrollmentError) {
    return { ok: false, status: 'unavailable', message: 'Programme reports are temporarily unavailable.' }
  }

  const decision = decideProgrammeReportAccess(enrollment, String(user.id), courseId)
  if (!decision.allowed || !enrollment) {
    return {
      ok: false,
      status: 'forbidden',
      message: 'Programme report is available after you are admitted to this programme.',
    }
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, description, thumbnail, duration, pricing, category_id, instructor_id')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError || !course) {
    return { ok: false, status: 'unavailable', message: 'This programme report could not be loaded.' }
  }

  let categoryName: string | null = null
  if (course.category_id) {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('name')
      .eq('id', course.category_id)
      .maybeSingle()
    categoryName = blank(category?.name)
  }

  const accessState = getEnrollmentAccessState({
    status: enrollment.status,
    access_starts_at: enrollment.access_starts_at,
    access_ends_at: enrollment.access_ends_at,
  })

  const [profileResult, curriculum, trainer, assessments, certificate, sessions] = await Promise.all([
    loadProfile(courseId, 'student'),
    loadCurriculum(courseId),
    loadTrainer(course.instructor_id ? String(course.instructor_id) : null),
    loadAssessments(courseId),
    loadCertificate(String(user.id), courseId),
    loadSessions(courseId, decision.hideLiveAccess),
  ])

  return {
    ok: true,
    report: {
      courseId,
      title: String(course.title ?? 'Programme'),
      description: blank(course.description),
      thumbnail: blank(course.thumbnail),
      categoryName,
      duration: blank(course.duration),
      pricing: course.pricing == null ? null : Number(course.pricing),
      profile: profileResult.profile,
      modules: curriculum.modules,
      ungroupedLessons: curriculum.ungroupedLessons,
      trainer,
      assessments,
      certificate,
      enrollment: {
        id: String(enrollment.id),
        amountDue: enrollment.amount_due == null ? null : Number(enrollment.amount_due),
        accessStartsAt: enrollment.access_starts_at ? String(enrollment.access_starts_at) : null,
        accessEndsAt: enrollment.access_ends_at ? String(enrollment.access_ends_at) : null,
        accessState: accessState === 'upcoming' || accessState === 'expired' ? accessState : 'active',
      },
      sessions,
      hideLiveAccess: decision.hideLiveAccess,
    },
  }
}

/**
 * Admin preview document. Callers must already have checked LEARNING_PROGRAMS.
 * This does not read or write courses.status and does not use a student enrolment.
 */
export async function loadCourseReportPreviewDocument(courseId: string): Promise<
  | { ok: true; preview: CourseReportPreview }
  | { ok: false; message: string }
> {
  if (!supabaseAdmin) {
    return { ok: false, message: 'Programme reports are temporarily unavailable.' }
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, description, thumbnail, duration, pricing, category_id, instructor_id')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError || !course) {
    return { ok: false, message: 'This course could not be loaded.' }
  }

  let categoryName: string | null = null
  if (course.category_id) {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('name')
      .eq('id', course.category_id)
      .maybeSingle()
    categoryName = blank(category?.name)
  }

  const [profileResult, curriculum, trainer, assessments, sessions] = await Promise.all([
    loadProfile(courseId, 'admin'),
    loadCurriculum(courseId),
    loadTrainer(course.instructor_id ? String(course.instructor_id) : null),
    loadAssessments(courseId),
    loadSessions(courseId, false),
  ])

  if (profileResult.storageError) {
    return { ok: false, message: profileResult.storageError }
  }

  return {
    ok: true,
    preview: {
      publicationStatus: profileResult.publicationStatus,
      report: {
        courseId,
        title: String(course.title ?? 'Programme'),
        description: blank(course.description),
        thumbnail: blank(course.thumbnail),
        categoryName,
        duration: blank(course.duration),
        pricing: course.pricing == null ? null : Number(course.pricing),
        profile: profileResult.profile,
        modules: curriculum.modules,
        ungroupedLessons: curriculum.ungroupedLessons,
        trainer,
        assessments,
        certificate: null,
        enrollment: {
          id: 'preview',
          amountDue: null,
          accessStartsAt: null,
          accessEndsAt: null,
          accessState: 'active',
        },
        sessions,
        hideLiveAccess: false,
      },
    },
  }
}
