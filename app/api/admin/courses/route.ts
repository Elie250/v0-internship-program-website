import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'
import { normalizeProgramType } from '@/lib/enrollment/program-types'
import { normalizeCourseRow } from '@/lib/platform/courses'

function normalizeCourse(row: Record<string, unknown>) {
  const normalized = normalizeCourseRow(row as Record<string, unknown> & { id: string; title: string })
  return {
    ...row,
    ...normalized,
    program: row.program ?? row.difficulty ?? '',
    program_type: normalized.program_type,
  }
}

function toCoursePayload(body: Record<string, unknown>) {
  const status = String(body.status ?? 'published')
  const program = String(body.program || body.difficulty || '')
  const programType = normalizeProgramType(body.program_type)
  return {
    title: body.title,
    description: body.description ?? null,
    duration: body.duration ?? null,
    thumbnail: body.thumbnail || body.image_url || null,
    difficulty: program || null,
    program: program || null,
    program_type: programType,
    pricing: body.pricing != null ? Number(body.pricing) : 0,
    status,
    category_id: body.category_id || null,
    scheduled_at: body.scheduled_at || null,
    location: body.location || null,
    meeting_link: body.meeting_link || null,
    program_end_date: body.program_end_date || null,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map(normalizeCourse))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courses'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()

    if (body.seedDefaults) {
      const { count } = await supabaseAdmin.from('courses').select('id', { count: 'exact', head: true })
      if ((count ?? 0) > 0) {
        return NextResponse.json({ error: 'Courses already exist. Delete or edit them instead.' }, { status: 400 })
      }

      const rows = TRAINING_PROGRAMS.map((program) => ({
        title: program.title,
        description: program.summary,
        duration: 'Flexible schedule',
        difficulty: program.title,
        program: program.title,
        program_type: 'training',
        pricing: 0,
        status: 'published',
      }))

      const { data, error } = await supabaseAdmin.from('courses').insert(rows).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json((data ?? []).map(normalizeCourse), { status: 201 })
    }

    const payload = toCoursePayload(body)
    if (!payload.title || !String(payload.title).trim()) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('courses').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeCourse(data), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create course'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
