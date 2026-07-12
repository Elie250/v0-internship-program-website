import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireStudentSession } from '@/lib/student/access'
import {
  libraryItemPayloadFromBody,
  normalizeLibraryItem,
  type LibraryCultureType,
} from '@/lib/library/items'
import { LIBRARY_TERMS_VERSION } from '@/lib/library/terms'
import { STUDENT_LIBRARY_PILLARS, validateLibraryItemPayload } from '@/lib/library/validation'

const CULTURE_TYPES = new Set(['inkuru', 'ibisigo', 'imivugo', 'creative', 'other'])

export async function GET() {
  try {
    const user = await requireStudentSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .eq('uploaded_by', user.id)
      .eq('pillar', 'culture')
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
    const message = error instanceof Error ? error.message : 'Failed to load culture submissions'
    const status = message === 'Unauthorized' || message.includes('Student') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireStudentSession()
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

    const cultureType = String(body.culture_type ?? '').trim() as LibraryCultureType
    if (!CULTURE_TYPES.has(cultureType)) {
      return NextResponse.json({ error: 'Select a culture type (Inkuru, Ibisigo, Imivugo, etc.)' }, { status: 400 })
    }

    if (!STUDENT_LIBRARY_PILLARS.includes('culture')) {
      return NextResponse.json({ error: 'Students can submit culture items only' }, { status: 400 })
    }

    const authorName =
      String(body.author_name ?? '').trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      null

    const payload = libraryItemPayloadFromBody(
      {
        ...body,
        pillar: 'culture',
        culture_type: cultureType,
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeLibraryItem(data as Record<string, unknown>), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit culture item'
    const status = message === 'Unauthorized' || message.includes('Student') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
