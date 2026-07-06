import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { displayNameFromUser } from '@/lib/learning/display-creator'

const MISSING_TABLE = /relation .* does not exist|could not find the table/i

function tableNotReady(message: string) {
  return NextResponse.json(
    {
      error:
        'Classroom tables missing — run scripts/36-lecturer-classroom.sql in the Supabase SQL editor.',
      detail: message,
    },
    { status: 503 }
  )
}

/** GET: announcements + sessions for the classroom tab. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const [announcementsRes, sessionsRes] = await Promise.all([
      supabaseAdmin
        .from('course_announcements')
        .select('id, title, message, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('course_sessions')
        .select(
          'id, topic, scheduled_at, duration_minutes, meeting_link, location, recording_url, notes, created_at'
        )
        .eq('course_id', courseId)
        .order('scheduled_at', { ascending: true })
        .limit(100),
    ])

    const missing = [announcementsRes.error, sessionsRes.error].find(
      (e) => e && MISSING_TABLE.test(e.message)
    )
    if (missing) return tableNotReady(missing.message)

    if (announcementsRes.error) {
      return NextResponse.json({ error: announcementsRes.error.message }, { status: 500 })
    }
    if (sessionsRes.error) {
      return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 })
    }

    return NextResponse.json({
      announcements: announcementsRes.data ?? [],
      sessions: sessionsRes.data ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load classroom data'
    const status = message === 'Unauthorized' || message.includes('assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** POST: create an announcement or a session ({ kind: 'announcement' | 'session', ... }). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const kind = String(body.kind ?? '')

    if (kind === 'announcement') {
      const title = String(body.title ?? '').trim()
      const message = String(body.message ?? '').trim()
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
      }

      const scope = String(body.scope ?? 'class')
      const creatorName = displayNameFromUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })

      if (scope === 'platform' || scope === 'programme') {
        const { data, error } = await supabaseAdmin
          .from('announcements')
          .insert({
            title,
            message,
            content: message,
            status: 'published',
            is_published: true,
            type: 'news',
            created_by: user.id,
            creator_role: 'lecturer',
            creator_name: creatorName,
            course_id: scope === 'programme' ? courseId : null,
          })
          .select('id, title, message, created_at')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ ...data, scope })
      }

      const { data, error } = await supabaseAdmin
        .from('course_announcements')
        .insert({ course_id: courseId, created_by: user.id, title, message })
        .select('id, title, message, created_at')
        .single()

      if (error) {
        if (MISSING_TABLE.test(error.message)) return tableNotReady(error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }

    if (kind === 'session') {
      const topic = String(body.topic ?? '').trim()
      const scheduledAt = String(body.scheduled_at ?? '').trim()
      if (!topic || !scheduledAt) {
        return NextResponse.json({ error: 'Topic and date/time are required' }, { status: 400 })
      }
      const scheduledDate = new Date(scheduledAt)
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
      }

      const duration = body.duration_minutes != null ? Number(body.duration_minutes) : null
      const { data, error } = await supabaseAdmin
        .from('course_sessions')
        .insert({
          course_id: courseId,
          created_by: user.id,
          topic,
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: duration && duration > 0 ? Math.round(duration) : null,
          meeting_link: String(body.meeting_link ?? '').trim() || null,
          location: String(body.location ?? '').trim() || null,
          recording_url: String(body.recording_url ?? '').trim() || null,
          notes: String(body.notes ?? '').trim() || null,
        })
        .select(
          'id, topic, scheduled_at, duration_minutes, meeting_link, location, recording_url, notes, created_at'
        )
        .single()

      if (error) {
        if (MISSING_TABLE.test(error.message)) return tableNotReady(error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save'
    const status = message === 'Unauthorized' || message.includes('assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** DELETE: remove announcement or session (?kind=&itemId=). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const kind = String(searchParams.get('kind') ?? '')
    const itemId = String(searchParams.get('itemId') ?? '')
    if (!itemId || (kind !== 'announcement' && kind !== 'session')) {
      return NextResponse.json({ error: 'kind and itemId required' }, { status: 400 })
    }

    const table = kind === 'announcement' ? 'course_announcements' : 'course_sessions'
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', itemId)
      .eq('course_id', courseId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete'
    const status = message === 'Unauthorized' || message.includes('assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
