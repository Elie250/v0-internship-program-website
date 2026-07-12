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

export async function GET() {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .eq('uploaded_by', user.id)
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
    const message = error instanceof Error ? error.message : 'Failed to load library submissions'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'You must accept the Energy & Logics terms before submitting' },
        { status: 400 }
      )
    }

    const pillar = String(body.pillar ?? 'books') as LibraryPillar
    if (!LECTURER_LIBRARY_PILLARS.includes(pillar)) {
      return NextResponse.json(
        { error: 'Lecturers can submit books and culture items only' },
        { status: 400 }
      )
    }

    const authorName =
      String(body.author_name ?? '').trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      null

    const payload = libraryItemPayloadFromBody(
      {
        ...body,
        pillar,
        status: 'pending_review',
        author_name: authorName,
        terms_version: LIBRARY_TERMS_VERSION,
      },
      {
        uploadedBy: user.id,
        uploaderRole: user.role,
        termsAccepted: true,
      }
    )

    const validationError = validateLibraryItemPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      if (error.message.includes('pending_review') || error.message.includes('energy_library_items')) {
        return NextResponse.json(
          { error: 'Run scripts/53-energy-library.sql in Supabase.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeLibraryItem(data as Record<string, unknown>), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit library item'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
