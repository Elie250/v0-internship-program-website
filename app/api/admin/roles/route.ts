import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryRolesPermissionsData } from '@/lib/admin/data/roles'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ASSIGN_ROLE)
    const data = await queryRolesPermissionsData()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load roles'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
