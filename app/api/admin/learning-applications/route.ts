import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryLearningApplications } from '@/lib/admin/data/learning-applications'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    const { searchParams } = new URL(request.url)
    const filter = (searchParams.get('filter') ?? 'pending') as 'pending' | 'history' | 'all'
    const { rows, error } = await queryLearningApplications(filter)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load applications'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
