import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MISSING = /relation .* does not exist|could not find the table/i

export async function POST(request: Request) {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: string
  try {
    userId = JSON.parse(raw).id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const sessionId = String(body.sessionId ?? '')
  const courseId = String(body.courseId ?? '')
  if (!sessionId || !courseId) {
    return NextResponse.json({ error: 'sessionId and courseId required' }, { status: 400 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const { data: session } = await supabaseAdmin
    .from('course_sessions')
    .select('scheduled_at')
    .eq('id', sessionId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const start = new Date(String(session.scheduled_at)).getTime()
  const now = Date.now()
  if (now < start - 30 * 60_000 || now > start + 3 * 3_600_000) {
    return NextResponse.json({ error: 'Check-in is only open around the scheduled session time' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('course_session_attendance').upsert(
    {
      session_id: sessionId,
      enrollment_id: enrollment.id,
      user_id: userId,
      status: 'present',
      self_checked_in: true,
      marked_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,enrollment_id' }
  )

  if (error) {
    if (MISSING.test(error.message)) {
      return NextResponse.json({ error: 'Run scripts/38-classroom-enhancements.sql' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
