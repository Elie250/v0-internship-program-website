import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { normalizeProgramType } from '@/lib/enrollment/program-types'
import { validateInstructorId } from '@/lib/admin/instructor-assignment'

function normalizeCourse(row: Record<string, unknown>) {
  const status = row.status ?? (row.is_published ? 'published' : 'draft')
  return {
    ...row,
    status,
    program: row.program ?? row.difficulty ?? '',
  }
}

function toCoursePayload(body: Record<string, unknown>, partial = false) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (!partial || body.title !== undefined) update.title = body.title
  if (!partial || body.description !== undefined) update.description = body.description ?? null
  if (!partial || body.duration !== undefined) update.duration = body.duration ?? null
  if (!partial || body.thumbnail !== undefined || body.image_url !== undefined) {
    update.thumbnail = body.thumbnail || body.image_url || null
  }
  if (!partial || body.program !== undefined || body.difficulty !== undefined) {
    const program = String(body.program || body.difficulty || '')
    update.difficulty = program || null
    update.program = program || null
  }
  if (!partial || body.pricing !== undefined) {
    update.pricing = body.pricing != null ? Number(body.pricing) : 0
  }
  if (!partial || body.program_type !== undefined) {
    update.program_type = normalizeProgramType(body.program_type)
  }
  if (!partial || body.scheduled_at !== undefined) {
    update.scheduled_at = body.scheduled_at || null
  }
  if (!partial || body.location !== undefined) {
    update.location = body.location || null
  }
  if (!partial || body.meeting_link !== undefined) {
    update.meeting_link = body.meeting_link || null
  }
  if (!partial || body.program_end_date !== undefined) {
    update.program_end_date = body.program_end_date || null
  }
  if (!partial || body.category_id !== undefined) update.category_id = body.category_id || null
  if (!partial || body.instructor_id !== undefined) {
    update.instructor_id =
      body.instructor_id === 'none' || body.instructor_id === '' || body.instructor_id == null
        ? null
        : String(body.instructor_id)
  }

  if (!partial || body.status !== undefined) {
    update.status = String(body.status)
  }

  return update
}

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
    const body = await request.json()

    if (body.instructor_id !== undefined) {
      const instructor = await validateInstructorId(body.instructor_id)
      if (instructor.error) {
        return NextResponse.json({ error: instructor.error }, { status: 400 })
      }
      body.instructor_id = instructor.id ?? 'none'
    }

    const payload = toCoursePayload(body, true)
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeCourse(data))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update course'
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
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete course'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
