import { NextResponse } from 'next/server'
import { createStaffSession, revokeStaffSession } from '@/lib/staff/auth'
import { requireStaffSession } from '@/lib/staff/context'
import { assertStaffMutationAllowed, extractStaffToken } from '@/lib/staff/request-auth'
import {
  checkStaffLoginRateLimit,
  getClientIpFromRequest,
} from '@/lib/staff/login-rate-limit'
import {
  readStaffSessionCookieFromRequest,
  STAFF_SESSION_COOKIE,
  staffSessionCookieOptions,
} from '@/lib/staff/session-cookie'

/**
 * Staff login.
 * - Always creates a staff_sessions row (shared by web + future Android).
 * - Returns Bearer token in JSON for mobile clients.
 * - Also sets httpOnly staff_session cookie for the Shop web portal.
 *
 * CSRF: enforced when a staff cookie already exists. Initial login (no cookie)
 * must remain reachable for Android / API clients without a browser Origin.
 */
export async function POST(request: Request) {
  try {
    const existingCookie = readStaffSessionCookieFromRequest(request)
    if (existingCookie) {
      const csrf = assertStaffMutationAllowed(request)
      if (!csrf.ok) {
        return NextResponse.json({ error: csrf.error }, { status: 403 })
      }
    }

    const body = await request.json()
    const email = String(body.email ?? '')
    const password = String(body.password ?? '')

    const rate = checkStaffLoginRateLimit({
      email,
      clientIp: getClientIpFromRequest(request),
    })
    if (!rate.allowed) {
      const response = NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
      if (rate.retryAfterSec) {
        response.headers.set('Retry-After', String(rate.retryAfterSec))
      }
      return response
    }

    const result = await createStaffSession({
      email,
      password,
      userAgent: request.headers.get('user-agent'),
    })

    if (!result.session) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    const response = NextResponse.json({
      token: result.session.token,
      expiresAt: result.session.expiresAt,
      sessionId: result.session.sessionId,
      user: result.session.user,
    })

    response.cookies.set(
      STAFF_SESSION_COOKIE,
      result.session.token,
      staffSessionCookieOptions()
    )

    return response
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const token = extractStaffToken(request)
    const result = await revokeStaffSession(token)
    if (!result.success) {
      const response = NextResponse.json(
        { error: result.error || 'Logout failed' },
        { status: 401 }
      )
      response.cookies.set(STAFF_SESSION_COOKIE, '', staffSessionCookieOptions(0))
      return response
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(STAFF_SESSION_COOKIE, '', staffSessionCookieOptions(0))
    return response
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const auth = await requireStaffSession(request)
  if ('response' in auth) return auth.response
  return NextResponse.json({ user: auth.ctx.user, sessionId: auth.ctx.sessionId })
}
