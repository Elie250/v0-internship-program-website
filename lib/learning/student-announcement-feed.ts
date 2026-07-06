import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { displayNameFromUser, formatCreatorLabel } from '@/lib/learning/display-creator'

const MISSING_TABLE = /relation .* does not exist|could not find the table/i

export type StudentFeedItem = {
  id: string
  kind: 'platform' | 'programme' | 'session' | 'webinar'
  title: string
  message: string
  created_at: string
  scheduled_at?: string | null
  meeting_link?: string | null
  recording_url?: string | null
  location?: string | null
  duration_minutes?: number | null
  courseId?: string | null
  courseTitle?: string | null
  creatorLabel: string
}

export type StudentAnnouncementFeed = {
  platform: StudentFeedItem[]
  programme: StudentFeedItem[]
  sessions: StudentFeedItem[]
  webinars: StudentFeedItem[]
  /** Flat list for legacy consumers — newest first */
  all: StudentFeedItem[]
}

type UserJoin = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  role?: string | null
}

function resolveCreator(
  storedRole: string | null | undefined,
  storedName: string | null | undefined,
  user: UserJoin | UserJoin[] | null | undefined
): string {
  if (storedName || storedRole) {
    return formatCreatorLabel(storedRole, storedName)
  }
  const u = Array.isArray(user) ? user[0] : user
  if (!u) return 'Staff'
  return formatCreatorLabel(u.role, displayNameFromUser(u))
}

export async function buildStudentAnnouncementFeed(params: {
  admittedCourseIds: string[]
  courseTitleById: Map<string, string>
  includeWebinars?: boolean
}): Promise<StudentAnnouncementFeed> {
  const empty: StudentAnnouncementFeed = {
    platform: [],
    programme: [],
    sessions: [],
    webinars: [],
    all: [],
  }

  if (!supabaseAdmin) return empty

  const { admittedCourseIds, courseTitleById, includeWebinars = true } = params
  const courseIdSet = new Set(admittedCourseIds)

  const platformQuery = supabaseAdmin
    .from('announcements')
    .select(
      'id, title, message, content, created_at, creator_role, creator_name, course_id, created_by, users:created_by(first_name, last_name, email, role)'
    )
    .or('status.eq.published,is_featured.eq.true')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: platformRows, error: platformError } = await platformQuery
  if (platformError && !MISSING_TABLE.test(platformError.message)) {
    const fallback = await supabaseAdmin
      .from('announcements')
      .select('id, title, message, content, created_at')
      .or('status.eq.published,is_featured.eq.true')
      .order('created_at', { ascending: false })
      .limit(30)
    if (fallback.error) return empty
    const platform: StudentFeedItem[] = (fallback.data ?? []).map((row) => ({
      id: String(row.id),
      kind: 'platform',
      title: String(row.title ?? ''),
      message: String(row.message ?? row.content ?? ''),
      created_at: String(row.created_at),
      creatorLabel: 'Admin',
    }))
    return mergeFeed({ platform, programme: [], sessions: [], webinars: [] })
  }

  const platform: StudentFeedItem[] = (platformRows ?? [])
    .filter((row) => {
      const scopedCourseId = row.course_id as string | null
      if (!scopedCourseId) return true
      return courseIdSet.has(scopedCourseId)
    })
    .map((row) => ({
      id: String(row.id),
      kind: 'platform' as const,
      title: String(row.title ?? ''),
      message: String(row.message ?? row.content ?? ''),
      created_at: String(row.created_at),
      courseId: (row.course_id as string | null) ?? null,
      courseTitle: row.course_id
        ? (courseTitleById.get(String(row.course_id)) ?? null)
        : null,
      creatorLabel: resolveCreator(
        row.creator_role as string | null,
        row.creator_name as string | null,
        row.users as UserJoin | UserJoin[] | null
      ),
    }))

  let programme: StudentFeedItem[] = []
  let sessions: StudentFeedItem[] = []

  if (admittedCourseIds.length > 0) {
    const [progRes, sessRes] = await Promise.all([
      supabaseAdmin
        .from('course_announcements')
        .select(
          'id, title, message, created_at, course_id, created_by, users:created_by(first_name, last_name, email, role), courses(title)'
        )
        .in('course_id', admittedCourseIds)
        .order('created_at', { ascending: false })
        .limit(40),
      supabaseAdmin
        .from('course_sessions')
        .select(
          'id, topic, scheduled_at, duration_minutes, meeting_link, location, recording_url, notes, created_at, course_id, created_by, users:created_by(first_name, last_name, email, role), courses(title)'
        )
        .in('course_id', admittedCourseIds)
        .order('scheduled_at', { ascending: true })
        .limit(60),
    ])

    if (!progRes.error || MISSING_TABLE.test(progRes.error.message)) {
      programme = (progRes.data ?? []).map((row) => {
        const course = Array.isArray(row.courses) ? row.courses[0] : row.courses
        const courseTitle =
          (course as { title?: string } | null)?.title ??
          courseTitleById.get(String(row.course_id)) ??
          null
        const creator = resolveCreator(
          'lecturer',
          null,
          row.users as UserJoin | UserJoin[] | null
        )
        return {
          id: String(row.id),
          kind: 'programme' as const,
          title: String(row.title ?? ''),
          message: String(row.message ?? ''),
          created_at: String(row.created_at),
          courseId: String(row.course_id),
          courseTitle,
          creatorLabel: courseTitle ? `${creator} · ${courseTitle}` : creator,
        }
      })
    }

    if (!sessRes.error || MISSING_TABLE.test(sessRes.error.message)) {
      const nowMs = Date.now() - 3_600_000
      sessions = (sessRes.data ?? [])
        .filter((row) => new Date(String(row.scheduled_at)).getTime() >= nowMs)
        .map((row) => {
          const course = Array.isArray(row.courses) ? row.courses[0] : row.courses
          const courseTitle =
            (course as { title?: string } | null)?.title ??
            courseTitleById.get(String(row.course_id)) ??
            null
          const creator = resolveCreator(
            'lecturer',
            null,
            row.users as UserJoin | UserJoin[] | null
          )
          const notes = row.notes ? String(row.notes) : ''
          return {
            id: String(row.id),
            kind: 'session' as const,
            title: String(row.topic ?? ''),
            message: notes,
            created_at: String(row.created_at ?? row.scheduled_at),
            scheduled_at: String(row.scheduled_at),
            meeting_link: (row.meeting_link as string | null) ?? null,
            recording_url: (row.recording_url as string | null) ?? null,
            location: (row.location as string | null) ?? null,
            duration_minutes:
              row.duration_minutes != null ? Number(row.duration_minutes) : null,
            courseId: String(row.course_id),
            courseTitle,
            creatorLabel: courseTitle ? `${creator} · ${courseTitle}` : creator,
          }
        })
    }
  }

  let webinars: StudentFeedItem[] = []
  if (includeWebinars) {
    const { data: webinarRows } = await supabaseAdmin
      .from('webinars')
      .select(
        'id, title, description, scheduled_at, meeting_link, recording_url, host_name, host_role, created_at'
      )
      .eq('status', 'published')
      .order('scheduled_at', { ascending: true })
      .limit(20)

    const nowMs = Date.now() - 3_600_000
    webinars = (webinarRows ?? [])
      .filter((w) => {
        if (!w.scheduled_at) return true
        return new Date(String(w.scheduled_at)).getTime() >= nowMs
      })
      .map((w) => ({
        id: String(w.id),
        kind: 'webinar' as const,
        title: String(w.title ?? ''),
        message: String(w.description ?? ''),
        created_at: String(w.created_at ?? w.scheduled_at ?? new Date().toISOString()),
        scheduled_at: (w.scheduled_at as string | null) ?? null,
        meeting_link: (w.meeting_link as string | null) ?? null,
        recording_url: (w.recording_url as string | null) ?? null,
        creatorLabel: formatCreatorLabel(
          (w.host_role as string | null) ?? 'lecturer',
          w.host_name as string | null
        ),
      }))
  }

  return mergeFeed({ platform, programme, sessions, webinars })
}

function mergeFeed(parts: {
  platform: StudentFeedItem[]
  programme: StudentFeedItem[]
  sessions: StudentFeedItem[]
  webinars: StudentFeedItem[]
}): StudentAnnouncementFeed {
  const sortTs = (item: StudentFeedItem) =>
    new Date(item.scheduled_at ?? item.created_at).getTime()

  const all = [
    ...parts.platform,
    ...parts.programme,
    ...parts.sessions,
    ...parts.webinars,
  ].sort((a, b) => sortTs(b) - sortTs(a))

  return { ...parts, all }
}
