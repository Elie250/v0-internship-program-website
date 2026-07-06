import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import { displayNameFromUser } from '@/lib/learning/display-creator'

/** GET — webinars hosted by the current lecturer. */
export async function GET() {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('webinars')
      .select('*')
      .eq('host_user_id', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load webinars'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** POST — publish a webinar as the lecturer host (visible to admitted students). */
export async function POST(request: Request) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const title = String(body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hostName = displayNameFromUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })

    const { data, error } = await supabaseAdmin
      .from('webinars')
      .insert([
        {
          title,
          description: String(body.description ?? '').trim() || null,
          scheduled_at: body.scheduled_at ? new Date(String(body.scheduled_at)).toISOString() : null,
          meeting_link: String(body.meeting_link ?? '').trim() || null,
          recording_url: String(body.recording_url ?? '').trim() || null,
          status: 'published',
          is_paid: false,
          price: 0,
          host_user_id: user.id,
          host_name: hostName,
          host_role: 'lecturer',
        },
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create webinar'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
