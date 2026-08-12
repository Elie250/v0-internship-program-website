import { NextResponse } from 'next/server'
import { requestRecruitmentMagicLink } from '@/lib/recruitment/passwordless-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '')
    const result = await requestRecruitmentMagicLink(email)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch {
    return NextResponse.json({ error: 'Could not start sign-in' }, { status: 500 })
  }
}
