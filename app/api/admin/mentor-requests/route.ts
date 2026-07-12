import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { logAdminAction } from '@/lib/admin/audit-log'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('mentor_match_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error?.message?.includes('mentor_match_requests')) {
      return NextResponse.json([])
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(
      (data ?? []).map((row) => ({
        id: String(row.id),
        fullName: String(row.full_name),
        email: String(row.email),
        phone: row.phone != null ? String(row.phone) : null,
        focusArea: String(row.focus_area),
        message: row.message != null ? String(row.message) : null,
        status: String(row.status),
        createdAt: String(row.created_at),
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.APPLICATIONS_MANAGE)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const id = String(body.id ?? '')
    const status = String(body.status ?? '')
    if (!id || !['matched', 'closed', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('mentor_match_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: 'update_status',
      module: 'mentor_matching',
      targetType: 'mentor_match_request',
      targetId: id,
      summary: `Updated mentor request to ${status}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
