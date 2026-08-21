import { NextResponse } from 'next/server'
import {
  extractBearerToken,
  getStaffSessionFromToken,
  type StaffAuthUser,
} from '@/lib/staff/auth'
import { hasPermission, type Permission } from '@/lib/admin/permissions'

export type StaffRequestContext = {
  sessionId: string
  user: StaffAuthUser
}

export async function requireStaffSession(
  request: Request
): Promise<{ ctx: StaffRequestContext } | { response: NextResponse }> {
  const token = extractBearerToken(request)
  const result = await getStaffSessionFromToken(token)
  if (!result.session) {
    return {
      response: NextResponse.json(
        { error: result.error || 'Unauthorized' },
        { status: result.error === 'Session expired' ? 401 : 401 }
      ),
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
