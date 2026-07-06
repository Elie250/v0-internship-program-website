import { NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/auth/password-reset'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '')
    const result = await requestPasswordReset(email)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
