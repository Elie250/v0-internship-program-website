import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAppUrl } from '@/lib/email/core'
import { unsubscribeFromDigest } from '@/lib/engineering/digest-subscribers'

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const user = await getSessionUser()

  if (!user?.id && !token) {
    return NextResponse.json({ error: 'Missing token or session' }, { status: 401 })
  }

  const result = await unsubscribeFromDigest({ userId: user?.id, token })
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Unsubscribe failed' }, { status: 400 })
  }

  const redirectUrl = `${getAppUrl()}/engineering/digest/manage?unsubscribed=1${token ? `&token=${encodeURIComponent(token)}` : ''}`
  return NextResponse.redirect(redirectUrl)
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  let token = searchParams.get('token')
  const user = await getSessionUser()

  if (!token) {
    try {
      const body = await request.json()
      token = body.token != null ? String(body.token) : null
    } catch {
      token = null
    }
  }

  if (!user?.id && !token) {
    return NextResponse.json({ error: 'Missing token or session' }, { status: 401 })
  }

  const result = await unsubscribeFromDigest({ userId: user?.id, token })
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Unsubscribe failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
