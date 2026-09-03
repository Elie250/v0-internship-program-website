import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { mutateStaffStock } from '@/lib/shop/staff-api/inventory'

export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.stockAdjust)
    if ('response' in auth) return auth.response

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const result = await mutateStaffStock({
      productId: String(body.productId ?? body.product_id ?? ''),
      quantityDelta: Number(body.quantityDelta ?? body.quantity_delta ?? 0),
      reason: String(body.reason ?? ''),
      actorUserId: auth.ctx.user.id,
      operation: 'adjust',
    })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
  }
}
