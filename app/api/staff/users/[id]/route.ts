import { NextResponse } from 'next/server'
import { requireShopAdmin } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { getShopStaffUser, updateShopStaffUser } from '@/lib/shop/staff-users'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const result = await getShopStaffUser(id)
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json({ user: result.user })
  } catch {
    return NextResponse.json({ error: 'Failed to load staff member' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const statusRaw = body.status
    const status =
      statusRaw === 'active' || statusRaw === 'inactive' || statusRaw === 'suspended'
        ? statusRaw
        : undefined

    const result = await updateShopStaffUser({
      id,
      actorUserId: auth.ctx.user.id,
      email: body.email !== undefined ? String(body.email) : undefined,
      firstName:
        body.firstName !== undefined
          ? String(body.firstName)
          : body.first_name !== undefined
            ? String(body.first_name)
            : undefined,
      lastName:
        body.lastName !== undefined
          ? String(body.lastName)
          : body.last_name !== undefined
            ? String(body.last_name)
            : undefined,
      role: body.role,
      status,
      permissions: body.permissions,
    })

    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json({ user: result.user })
  } catch {
    return NextResponse.json({ error: 'Unable to update staff member' }, { status: 500 })
  }
}
