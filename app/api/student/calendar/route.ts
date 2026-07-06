import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MISSING = /relation .* does not exist|could not find the table/i

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export type CalendarEvent = {
  id: string
  type: 'session' | 'webinar' | 'quiz'
  title: string
  courseTitle?: string | null
  startsAt: string
  endsAt?: string | null
  meetingLink?: string | null
  href?: string | null
}

export async function GET() {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { data: enrollments } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, course_id, status, course:courses(id, title)')
    .eq('user_id', user.id)
    .eq('status', 'admitted')

  const admitted = enrollments ?? []
  const courseIds = admitted.map((e) => e.course_id).filter(Boolean) as string[]
  const courseTitleById = new Map<string, string>()
  for (const row of admitted) {
    const course = Array.isArray(row.course) ? row.course[0] : row.course
    if (row.course_id && course?.title) courseTitleById.set(row.course_id, course.title)
  }

  const events: CalendarEvent[] = []
  const now = new Date()
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + 90)

  if (courseIds.length) {
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('course_sessions')
      .select('id, course_id, topic, scheduled_at, duration_minutes, meeting_link')
      .in('course_id', courseIds)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', horizon.toISOString())
      .order('scheduled_at', { ascending: true })

    if (sessionError && !MISSING.test(sessionError.message)) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    for (const s of sessions ?? []) {
      const start = new Date(String(s.scheduled_at))
      const end = s.duration_minutes
        ? new Date(start.getTime() + Number(s.duration_minutes) * 60_000).toISOString()
        : null
      events.push({
        id: `session-${s.id}`,
        type: 'session',
        title: String(s.topic),
        courseTitle: courseTitleById.get(String(s.course_id)) ?? null,
        startsAt: start.toISOString(),
        endsAt: end,
        meetingLink: (s.meeting_link as string | null) ?? null,
        href: `/student/courses/${s.course_id}`,
      })
    }

    const { data: quizzes, error: quizError } = await supabaseAdmin
      .from('course_assessments')
      .select('id, course_id, title, due_at, is_published')
      .in('course_id', courseIds)
      .not('due_at', 'is', null)
      .gte('due_at', now.toISOString())
      .lte('due_at', horizon.toISOString())
      .order('due_at', { ascending: true })

    if (!quizError) {
      for (const q of quizzes ?? []) {
        if (q.is_published === false) continue
        events.push({
          id: `quiz-${q.id}`,
          type: 'quiz',
          title: `Quiz due: ${q.title}`,
          courseTitle: courseTitleById.get(String(q.course_id)) ?? null,
          startsAt: new Date(String(q.due_at)).toISOString(),
          href: `/student/courses/${q.course_id}`,
        })
      }
    }
  }

  const { data: webinars } = await supabaseAdmin
    .from('webinars')
    .select('id, title, scheduled_at, meeting_link')
    .eq('status', 'published')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', horizon.toISOString())
    .order('scheduled_at', { ascending: true })

  for (const w of webinars ?? []) {
    if (!w.scheduled_at) continue
    events.push({
      id: `webinar-${w.id}`,
      type: 'webinar',
      title: String(w.title),
      startsAt: new Date(String(w.scheduled_at)).toISOString(),
      meetingLink: (w.meeting_link as string | null) ?? null,
      href: '/student/dashboard?tab=webinars',
    })
  }

  events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  return NextResponse.json({ events })
}
