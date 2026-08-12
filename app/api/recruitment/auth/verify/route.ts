import { NextResponse } from 'next/server'
import { consumeRecruitmentMagicLink } from '@/lib/recruitment/passwordless-auth'
import { safeRecruitmentRedirect } from '@/lib/recruitment/post-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = String(body.token ?? '')
    const requestedRedirect = safeRecruitmentRedirect(body.redirect)
    const registerIntent =
      body.intent === 'employer' || body.intent === 'candidate' ? body.intent : null
    const result = await consumeRecruitmentMagicLink(token, requestedRedirect, registerIntent)
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Sign-in failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, redirectTo: result.redirectTo ?? '/app' })
  } catch {
    return NextResponse.json({ error: 'Could not complete sign-in' }, { status: 500 })
  }
}
