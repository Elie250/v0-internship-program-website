import { NextResponse } from 'next/server'
import { requireShopAdmin } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { revokeShopStaffSessions } from '@/lib/shop/staff-users'

type RouteContext = { params: Promise<{ id: string }> }

/** Revoke all active staff_sessions for one user. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const result = await revokeShopStaffSessions(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({
      success: true,
      revokedCount: result.revokedCount ?? 0,
      message: 'Sessions revoked',
    })
  } catch {
    return NextResponse.json({ error: 'Unable to revoke sessions' }, { status: 500 })
  }
}
