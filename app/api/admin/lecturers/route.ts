import { NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/admin/access-control'
import { queryAssignableLecturers } from '@/lib/admin/data/lecturers'

export async function GET() {
  try {
    await requirePlatformAdmin()
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
