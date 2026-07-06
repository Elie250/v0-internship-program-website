import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryLearningAnalytics } from '@/lib/admin/data/learning-analytics'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { courses, error } = await queryLearningAnalytics()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(courses)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
