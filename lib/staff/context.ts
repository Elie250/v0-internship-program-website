import { NextResponse } from 'next/server'
import { getStaffSessionFromToken, type StaffAuthUser } from '@/lib/staff/auth'
import { extractStaffToken } from '@/lib/staff/request-auth'
import { hasPermission, type Permission } from '@/lib/admin/permissions'

export type StaffRequestContext = {
  sessionId: string
  user: StaffAuthUser
}

export async function requireStaffSession(
  request: Request
): Promise<{ ctx: StaffRequestContext } | { response: NextResponse }> {
  const token = extractStaffToken(request)
  const result = await getStaffSessionFromToken(token)
  if (!result.session) {
    return {
      response: NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ctx: result.session }
}

export async function requireStaffPermission(
  request: Request,
  required: Permission | Permission[]
): Promise<{ ctx: StaffRequestContext } | { response: NextResponse }> {
  const auth = await requireStaffSession(request)
  if ('response' in auth) return auth

  if (!hasPermission(auth.ctx.user.permissions, required)) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}
