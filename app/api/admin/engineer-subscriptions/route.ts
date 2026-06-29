import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryEngineerSubscriptionApplications } from '@/lib/admin/data/engineer-subscriptions'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const { searchParams } = new URL(request.url)
    const filter = (searchParams.get('filter') ?? 'pending') as 'pending' | 'history' | 'all'
    const { rows, error } = await queryEngineerSubscriptionApplications(filter)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
