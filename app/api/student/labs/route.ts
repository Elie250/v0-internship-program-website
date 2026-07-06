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

export async function GET(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

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

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('lab_submissions')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: false })

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
  const title = String(body.title ?? '').trim()
  if (!courseId || !title) {
    return NextResponse.json({ error: 'courseId and title required' }, { status: 400 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('lab_submissions')
    .insert({
      course_id: courseId,
      enrollment_id: enrollment.id,
      user_id: user.id,
      lesson_id: body.lessonId ? String(body.lessonId) : null,
      title,
      file_url: body.fileUrl ? String(body.fileUrl) : null,
      file_name: body.fileName ? String(body.fileName) : null,
      notes: body.notes ? String(body.notes) : null,
      status: 'submitted',
    })
    .select()
    .single()

  if (error) {
    if (MISSING.test(error.message)) {
      return NextResponse.json(
        { error: 'Run scripts/38-classroom-enhancements.sql in Supabase.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
