import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { canViewStaffProductCost } from '@/lib/shop/staff-api/cost-policy'
import { getStaffOrderById, updateStaffOrderFulfillment } from '@/lib/shop/staff-api/orders'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.orders)
    if ('response' in auth) return auth.response

    const includeCost = canViewStaffProductCost(auth.ctx.user.permissions)
    const { id } = await context.params
    const result = await getStaffOrderById(id, { includeCost })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.fulfillment)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const result = await updateStaffOrderFulfillment({
      id,
      status: body.status,
      extraFields: body,
    })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
