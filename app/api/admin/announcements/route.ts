import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

import { displayNameFromUser } from '@/lib/learning/display-creator'

function normalizeAnnouncement(row: Record<string, unknown>) {
  return {
    ...row,
    message: row.message ?? row.content ?? '',
    status: row.status ?? (row.is_published ? 'published' : 'draft'),
  }
}

function toAnnouncementPayload(body: Record<string, unknown>) {
  const status = String(body.status ?? (body.is_published ? 'published' : 'draft'))
  const message = String(body.message ?? body.content ?? '')
  return {
    title: body.title,
    message,
    content: message,
    image_url: body.image_url || null,
    is_featured: Boolean(body.is_featured),
    type: body.type || 'news',
    status,
    is_published: status === 'published',
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map(normalizeAnnouncement))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load announcements'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const creatorName = displayNameFromUser({
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      email: session.user.email,
    })
    const payload = {
      ...toAnnouncementPayload(body),
      created_by: session.user.id,
      creator_role: 'admin',
      creator_name: creatorName,
      course_id: body.course_id ? String(body.course_id) : null,
    }
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert([payload])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeAnnouncement(data), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create announcement'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
