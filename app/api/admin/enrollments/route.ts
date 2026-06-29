import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('*, course:courses(id, title, pricing)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
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

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .update({
        status,
        admin_notes: adminNotes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, course:courses(id, title)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update enrollment'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
