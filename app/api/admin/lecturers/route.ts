import { NextResponse } from 'next/server'
import { listAssignableLecturers } from '@/app/actions/admin-users'

export async function GET() {
  const result = await listAssignableLecturers()
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Failed to load lecturers' }, { status: 403 })
  }
  return NextResponse.json(result.lecturers ?? [])
}
