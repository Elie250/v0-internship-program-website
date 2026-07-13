import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  libraryItemPayloadFromBody,
  normalizeLibraryItem,
} from '@/lib/library/items'
import { LIBRARY_TERMS_VERSION } from '@/lib/library/terms'
import { validateLibraryItemPayload } from '@/lib/library/validation'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const body = await request.json()

    const { data: existing, error: loadError } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: 'Library item not found' }, { status: 404 })

    const merged = { ...(existing as Record<string, unknown>), ...body }
    const termsAccepted = Boolean(body.terms_accepted)

    if (!termsAccepted && !existing.terms_accepted_at) {
      return NextResponse.json(
        { error: 'You must accept the Energy & Logics terms before saving' },
        { status: 400 }
      )
    }

    const payload = libraryItemPayloadFromBody(merged, {
      termsAccepted: termsAccepted || undefined,
      uploaderRole: String(existing.uploader_role ?? 'admin'),
    })

    if (termsAccepted) {
      payload.terms_version = LIBRARY_TERMS_VERSION
    }

    const validationError = validateLibraryItemPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Library item not found' }, { status: 404 })
    return NextResponse.json(normalizeLibraryItem(data as Record<string, unknown>))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update library item'
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
    const { error } = await supabaseAdmin.from('energy_library_items').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete library item'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
