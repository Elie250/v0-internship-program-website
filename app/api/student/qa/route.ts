import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'

const MISSING = /relation .* does not exist|could not find the table/i

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; firstName?: string; lastName?: string; email?: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const courseId = String(searchParams.get('courseId') ?? '')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { data, error } = await supabaseAdmin
    .from('course_questions')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error && MISSING.test(error.message)) return NextResponse.json([])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const courseId = String(body.courseId ?? '')
  const question = String(body.question ?? '').trim()
  if (!courseId || !question) {
    return NextResponse.json({ error: 'courseId and question required' }, { status: 400 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const authorName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Student'

  const { data, error } = await supabaseAdmin
    .from('course_questions')
    .insert({ course_id: courseId, user_id: user.id, author_name: authorName, question })
    .select()
    .single()

  if (error) {
    if (MISSING.test(error.message)) {
      return NextResponse.json({ error: 'Run scripts/38-classroom-enhancements.sql' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const courseId = String(body.courseId ?? '')
    const questionId = String(body.questionId ?? '')
    const answer = String(body.answer ?? '').trim()
    if (!courseId || !questionId || !answer) {
      return NextResponse.json({ error: 'courseId, questionId, and answer required' }, { status: 400 })
    }

    const { user } = await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const { error } = await supabaseAdmin
      .from('course_questions')
      .update({
        answer,
        answered_by: user.id,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .eq('course_id', courseId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
