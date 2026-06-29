import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'

function normalizeCourse(row: Record<string, unknown>) {
  const status = row.status ?? (row.is_published ? 'published' : 'draft')
  return {
    ...row,
    status,
    program: row.program ?? row.difficulty ?? '',
  }
}

function toCoursePayload(body: Record<string, unknown>) {
  const status = String(body.status ?? (body.is_published ? 'published' : 'draft'))
  return {
    title: body.title,
    description: body.description ?? null,
    duration: body.duration ?? null,
    thumbnail: body.thumbnail || body.image_url || null,
    difficulty: body.program || body.difficulty || null,
    pricing: body.pricing != null ? Number(body.pricing) : 0,
    status,
    is_published: status === 'published',
    category_id: body.category_id || null,
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
      .select('*, category:categories(*)')
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
        pricing: 0,
        status: 'published',
        is_published: true,
      }))

      const { data, error } = await supabaseAdmin.from('courses').insert(rows).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json((data ?? []).map(normalizeCourse), { status: 201 })
    }

    const payload = toCoursePayload(body)
    const { data, error } = await supabaseAdmin.from('courses').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeCourse(data), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create course'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
