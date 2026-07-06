import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryClassroomMonitor } from '@/lib/admin/data/classroom-monitor'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { searchParams } = new URL(request.url)
    const window = (searchParams.get('window') as 'upcoming' | 'past' | 'all' | null) ?? 'upcoming'

    const { sessions, error } = await queryClassroomMonitor({ window })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(sessions)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
