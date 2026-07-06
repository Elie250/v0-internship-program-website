import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { MISSING_TABLE, queryCourseSessions } from '@/lib/learning/classroom-sessions'

async function sessionUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; role: string }
  } catch {
    return null
  }
}

/** GET ?courseId= — class announcements and session schedule for an admitted student. */
export async function GET(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = String(searchParams.get('courseId') ?? '')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) {
    return NextResponse.json({ error: 'You are not admitted to this programme' }, { status: 403 })
  }

  const [announcementsRes, sessionsResult] = await Promise.all([
    supabaseAdmin
      .from('course_announcements')
      .select('id, title, message, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(20),
    queryCourseSessions(courseId, 50),
  ])

  const announcements =
    announcementsRes.error && MISSING_TABLE.test(announcementsRes.error.message)
      ? []
      : (announcementsRes.data ?? [])
  const sessions =
    sessionsResult.error && MISSING_TABLE.test(sessionsResult.error)
      ? []
      : sessionsResult.sessions

  return NextResponse.json({ announcements, sessions })
}
