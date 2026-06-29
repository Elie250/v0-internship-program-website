import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { admitEnrollmentById, rejectEnrollmentById } from '@/lib/enrollment/admit'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const courseIds = [...new Set((data ?? []).map((row) => row.course_id).filter(Boolean))]
    let coursesById = new Map<string, { id: string; title: string; pricing?: number }>()

    if (courseIds.length) {
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id, title, pricing')
        .in('id', courseIds)
      coursesById = new Map((courses ?? []).map((course) => [course.id, course]))
    }

    const rows = (data ?? []).map((row) => ({
      ...row,
      course: row.course_id ? coursesById.get(row.course_id) ?? null : null,
    }))

    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load enrollments'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { id, status, adminNotes } = body
    if (!id || !status) {
      return NextResponse.json({ error: 'Enrollment id and status required' }, { status: 400 })
    }

    if (status === 'admitted') {
      const result = await admitEnrollmentById(id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      if (adminNotes?.trim()) {
        await supabaseAdmin
          .from('course_enrollments')
          .update({ admin_notes: adminNotes.trim(), updated_at: new Date().toISOString() })
          .eq('id', id)
      }
    } else if (status === 'payment_rejected') {
      const result = await rejectEnrollmentById(id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else {
      const { error } = await supabaseAdmin
        .from('course_enrollments')
        .update({
          status,
          admin_notes: adminNotes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data, error: fetchError } = await supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    let course = null
    if (data?.course_id) {
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('id', data.course_id)
        .maybeSingle()
      course = courseRow
    }

    return NextResponse.json({ ...data, course })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update enrollment'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
