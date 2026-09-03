import { NextResponse } from 'next/server'
import { requireShopAdmin } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import {
  createShopStaffUser,
  listShopStaffUsers,
} from '@/lib/shop/staff-users'

/**
 * Admin-only Shop staff list + create.
 * Custom shop extras are persisted to users.permissions after server-side filtering.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const params = new URL(request.url).searchParams
    const result = await listShopStaffUsers({
      search: params.get('search') ?? undefined,
      role: params.get('role') ?? undefined,
      status: params.get('status') ?? undefined,
    })
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json({ users: result.users })
  } catch {
    return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const result = await createShopStaffUser({
      email: String(body.email ?? ''),
      firstName: String(body.firstName ?? body.first_name ?? ''),
      lastName: String(body.lastName ?? body.last_name ?? ''),
      password: String(body.password ?? ''),
      role: body.role,
      permissions: body.permissions,
    })

    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({ user: result.user }, { status: result.httpStatus })
  } catch {
    return NextResponse.json({ error: 'Unable to create staff account' }, { status: 500 })
  }
}
