import { NextResponse } from 'next/server'
import { subscribeToEngineeringDigest } from '@/lib/email/engineering-digest'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await subscribeToEngineeringDigest({
      email: String(body.email ?? ''),
      name: body.name != null ? String(body.name) : null,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Subscription failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
