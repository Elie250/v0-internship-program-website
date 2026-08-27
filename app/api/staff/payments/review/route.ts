import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { reviewStaffShopOrderPayment } from '@/lib/shop/staff-api/payment-review'

/**
 * Staff MoMo review for commerce shop orders only.
 * Cookie (web) + Bearer (Android). CSRF required for cookie sessions.
 */
export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.paymentReview)
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const result = await reviewStaffShopOrderPayment({
      actor: {
        user: {
          id: auth.ctx.user.id,
          permissions: auth.ctx.user.permissions,
        },
      },
      orderId: (body as { orderId?: unknown }).orderId,
      decision: (body as { decision?: unknown }).decision,
      adminNotes: (body as { adminNotes?: unknown }).adminNotes,
    })

    if (!('success' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Payment review failed' }, { status: 500 })
  }
}
