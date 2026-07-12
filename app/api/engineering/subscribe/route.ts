import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { subscribeToEngineeringDigest } from '@/lib/email/engineering-digest'

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; email?: string }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getSessionUser()
    const email = String(body.email ?? '').trim().toLowerCase()
    const sessionEmail = user?.email?.trim().toLowerCase()
    const result = await subscribeToEngineeringDigest({
      email,
      name: body.name != null ? String(body.name) : null,
      userId: user?.id && sessionEmail === email ? user.id : null,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Subscription failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
