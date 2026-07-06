import { NextResponse } from 'next/server'
import { completePasswordReset } from '@/lib/auth/password-reset'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = String(body.token ?? '')
    const password = String(body.password ?? '')

    const result = await completePasswordReset(token, password)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'Password updated. You can sign in now.' })
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
