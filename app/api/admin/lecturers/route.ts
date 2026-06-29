import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryAssignableLecturers } from '@/lib/admin/data/lecturers'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { lecturers, error } = await queryAssignableLecturers()
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json(lecturers)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Forbidden' || message === 'Unauthorized' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
