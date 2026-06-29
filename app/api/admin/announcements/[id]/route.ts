import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

function normalizeAnnouncement(row: Record<string, unknown>) {
  return {
    ...row,
    message: row.message ?? row.content ?? '',
    status: row.status ?? (row.is_published ? 'published' : 'draft'),
  }
}

function toAnnouncementPayload(body: Record<string, unknown>, partial = false) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (!partial || body.title !== undefined) update.title = body.title
  if (!partial || body.message !== undefined || body.content !== undefined) {
    const message = String(body.message ?? body.content ?? '')
    update.message = message
    update.content = message
  }
  if (!partial || body.image_url !== undefined) update.image_url = body.image_url || null
  if (!partial || body.is_featured !== undefined) update.is_featured = Boolean(body.is_featured)
  if (!partial || body.type !== undefined) update.type = body.type || 'news'

  if (!partial || body.status !== undefined || body.is_published !== undefined) {
    const status = String(body.status ?? (body.is_published ? 'published' : 'draft'))
    update.status = status
    update.is_published = status === 'published'
  }

  return update
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const payload = toAnnouncementPayload(body, true)
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeAnnouncement(data))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update announcement'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete announcement'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
