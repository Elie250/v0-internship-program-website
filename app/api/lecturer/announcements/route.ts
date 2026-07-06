import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import { displayNameFromUser } from '@/lib/learning/display-creator'

/** POST — platform-wide public announcement from a lecturer. */
export async function POST(request: Request) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const title = String(body.title ?? '').trim()
    const message = String(body.message ?? '').trim()
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const creatorName = displayNameFromUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })

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
        course_id: body.course_id ? String(body.course_id) : null,
      })
      .select('id, title, message, created_at, creator_name, creator_role')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to post announcement'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
