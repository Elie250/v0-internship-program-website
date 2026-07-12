import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import {
  libraryItemPayloadFromBody,
  normalizeLibraryItem,
  type LibraryPillar,
} from '@/lib/library/items'
import { LIBRARY_TERMS_VERSION } from '@/lib/library/terms'
import { LECTURER_LIBRARY_PILLARS, validateLibraryItemPayload } from '@/lib/library/validation'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const { data: existing, error: loadError } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .eq('id', id)
      .eq('uploaded_by', user.id)
      .maybeSingle()

    if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    const existingStatus = String(existing.status)
    if (existingStatus === 'published' || existingStatus === 'archived') {
      return NextResponse.json(
        { error: 'Published or archived items cannot be edited here' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const termsAccepted = Boolean(body.terms_accepted)
    if (!termsAccepted && !existing.terms_accepted_at) {
      return NextResponse.json(
        { error: 'You must accept the Energy & Logics terms before saving' },
        { status: 400 }
      )
    }

    const pillar = String(body.pillar ?? existing.pillar) as LibraryPillar
    if (!LECTURER_LIBRARY_PILLARS.includes(pillar)) {
      return NextResponse.json(
        { error: 'Lecturers can submit books and culture items only' },
        { status: 400 }
      )
    }

    const merged = {
      ...(existing as Record<string, unknown>),
      ...body,
      pillar,
      status: 'pending_review',
      terms_version: LIBRARY_TERMS_VERSION,
    }

    const payload = libraryItemPayloadFromBody(merged, {
      uploadedBy: user.id,
      uploaderRole: user.role,
      termsAccepted: termsAccepted || undefined,
    })

    const validationError = validateLibraryItemPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .update(payload)
      .eq('id', id)
      .eq('uploaded_by', user.id)
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    return NextResponse.json(normalizeLibraryItem(data as Record<string, unknown>))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update submission'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const { data: existing } = await supabaseAdmin
      .from('energy_library_items')
      .select('status')
      .eq('id', id)
      .eq('uploaded_by', user.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    const status = String(existing.status)
    if (status === 'published') {
      return NextResponse.json(
        { error: 'Published items cannot be deleted. Contact an admin.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('energy_library_items')
      .delete()
      .eq('id', id)
      .eq('uploaded_by', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete submission'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
