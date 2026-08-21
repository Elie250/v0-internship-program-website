import { NextResponse } from 'next/server'
import { createStaffSession, extractBearerToken, revokeStaffSession } from '@/lib/staff/auth'
import { requireStaffSession } from '@/lib/staff/context'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '')
    const password = String(body.password ?? '')
    const result = await createStaffSession({
      email,
      password,
      userAgent: request.headers.get('user-agent'),
    })

    if (!result.session) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({
      token: result.session.token,
      expiresAt: result.session.expiresAt,
      sessionId: result.session.sessionId,
      user: result.session.user,
    })
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const token = extractBearerToken(request)
    const result = await revokeStaffSession(token)
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Logout failed' }, { status: 401 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const auth = await requireStaffSession(request)
  if ('response' in auth) return auth.response
  return NextResponse.json({ user: auth.ctx.user, sessionId: auth.ctx.sessionId })
}
