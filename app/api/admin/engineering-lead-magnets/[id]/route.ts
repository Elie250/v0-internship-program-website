import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  leadMagnetPayloadFromBody,
  normalizeLeadMagnet,
} from '@/lib/engineering/lead-magnets'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('engineering_lead_magnets')
      .update(leadMagnetPayloadFromBody(body))
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Lead magnet not found' }, { status: 404 })
    return NextResponse.json(normalizeLeadMagnet(data as Record<string, unknown>))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lead magnet'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const { error } = await supabaseAdmin.from('engineering_lead_magnets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete lead magnet'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
