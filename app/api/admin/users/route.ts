import { NextRequest, NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAdminUsers } from '@/lib/admin/data/users'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    const params = request.nextUrl.searchParams
    const { users, error } = await queryAdminUsers({
      search: params.get('search') ?? undefined,
      role: params.get('role') ?? undefined,
      status: params.get('status') ?? undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(users)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
