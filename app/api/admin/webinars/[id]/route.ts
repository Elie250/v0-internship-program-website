import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json() as Record<string, unknown>
    const update: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }

    if ('is_paid' in body) {
      const isPaid = Boolean(body.is_paid)
      update.is_paid = isPaid
      update.price = isPaid ? Math.max(0, Number(body.price ?? 0)) : 0
    }

    if ('host_user_id' in body) {
      const hostUserId = body.host_user_id ? String(body.host_user_id) : null
      if (hostUserId) {
        const { data: hostRow } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email, role')
          .eq('id', hostUserId)
          .maybeSingle()
        update.host_user_id = hostRow?.id ?? null
        update.host_name = hostRow
          ? [hostRow.first_name, hostRow.last_name].filter(Boolean).join(' ') || hostRow.email
          : null
        update.host_role = hostRow ? String(hostRow.role) : null
      } else {
        update.host_user_id = null
        update.host_name = null
        update.host_role = null
      }
    }

    const { data, error } = await supabaseAdmin
      .from('webinars')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update webinar'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin.from('webinars').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete webinar'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
