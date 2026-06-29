import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { querySupportSubscriptions } from '@/lib/admin/data/support-subscriptions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const { subscriptions, error } = await querySupportSubscriptions()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(subscriptions)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
