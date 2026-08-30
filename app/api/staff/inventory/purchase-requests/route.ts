import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { createStaffPurchaseRequest } from '@/lib/shop/staff-api/inventory'

export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.purchaseRequest)
    if ('response' in auth) return auth.response

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const result = await createStaffPurchaseRequest({
      productId: String(body.productId ?? body.product_id ?? ''),
      quantity: Number(body.quantity ?? 0),
      notes: body.notes != null ? String(body.notes) : null,
      actorUserId: auth.ctx.user.id,
    })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body, { status: result.httpStatus })
  } catch {
    return NextResponse.json({ error: 'Failed to create purchase request' }, { status: 500 })
  }
}
