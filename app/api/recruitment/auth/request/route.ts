import { NextResponse } from 'next/server'
import { getClientIpFromRequest } from '@/lib/recruitment/auth-rate-limit'
import { requestRecruitmentMagicLink } from '@/lib/recruitment/passwordless-auth'
import { safeRecruitmentRedirect } from '@/lib/recruitment/post-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '')
    const clientIp = getClientIpFromRequest(request)
    const redirect = safeRecruitmentRedirect(typeof body.redirect === 'string' ? body.redirect : null) ?? undefined
    const mode = body.mode === 'register' ? 'register' : 'signin'
    const registerIntent =
      body.registerIntent === 'employer' || body.registerIntent === 'candidate'
        ? body.registerIntent
        : undefined
    const companyName =
      typeof body.companyName === 'string' ? body.companyName.trim().slice(0, 120) : undefined
    // Ignore body.role — capabilities are derived server-side after verification.

    const result = await requestRecruitmentMagicLink(email, clientIp, redirect, {
      mode,
      registerIntent,
      companyName,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch {
    return NextResponse.json({ error: 'Could not start sign-in' }, { status: 500 })
  }
}
