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
import { logAdminAction } from '@/lib/admin/audit-log'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error?.message?.includes('energy_library_items')) {
      return NextResponse.json(
        { error: 'Run scripts/53-energy-library.sql in Supabase.' },
        { status: 500 }
      )
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(
      (data ?? []).map((row) => normalizeLibraryItem(row as Record<string, unknown>))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load library items'
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
    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'You must accept the Energy & Logics terms before uploading' },
        { status: 400 }
      )
    }

    const payload = libraryItemPayloadFromBody(body, {
      uploadedBy: session.user.id,
      uploaderRole: session.user.role,
      termsAccepted: true,
    })
    payload.terms_version = LIBRARY_TERMS_VERSION

    const validationError = validateLibraryItemPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .insert([payload])
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const item = normalizeLibraryItem(data as Record<string, unknown>)
    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: 'create',
      module: 'energy_library',
      targetType: 'energy_library_item',
      targetId: item.id,
      summary: `Created library item “${item.title}”`,
      metadata: { pillar: item.pillar, gallery_type: item.gallery_type },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create library item'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
