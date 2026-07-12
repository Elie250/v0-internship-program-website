import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryAuditLogs } from '@/lib/admin/audit-log'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    const rows = await queryAuditLogs(150)
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
