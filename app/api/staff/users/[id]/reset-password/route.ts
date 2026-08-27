import { NextResponse } from 'next/server'
import { requireShopAdmin } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { resetShopStaffPassword } from '@/lib/shop/staff-users'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Admin sets a new staff password (bcrypt). Hash is never returned.
 * Active staff sessions for that user are revoked.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireShopAdmin(request)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const newPassword = String(body.newPassword ?? body.password ?? '')

    const result = await resetShopStaffPassword({ id, newPassword })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({ success: true, message: 'Password updated' })
  } catch {
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
