import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getDigestSubscriber,
  unsubscribeFromDigest,
  updateDigestPreferences,
  type DigestFrequency,
} from '@/lib/engineering/digest-subscribers'

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; email?: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const user = await getSessionUser()

  const subscriber = await getDigestSubscriber({
    userId: user?.id,
    token,
    email: user?.email,
  })

  if (!subscriber) {
    return NextResponse.json({ subscriber: null })
  }

  return NextResponse.json({ subscriber })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const user = await getSessionUser()

  if (!user?.id && !token) {
    return NextResponse.json({ error: 'Log in or provide a manage token.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const preferredTags = Array.isArray(body.preferredTags)
      ? body.preferredTags.map(String)
      : undefined
    const frequency =
      body.frequency === 'weekly' || body.frequency === 'off'
        ? (body.frequency as DigestFrequency)
        : undefined
    const name = body.name != null ? String(body.name) : undefined

    const result = await updateDigestPreferences({
      userId: user?.id,
      token,
      email: user?.email,
      preferredTags,
      frequency,
      name,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Update failed' }, { status: 400 })
    }

    return NextResponse.json({ subscriber: result.subscriber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const user = await getSessionUser()

  if (!user?.id && !token) {
    return NextResponse.json({ error: 'Log in or provide a manage token.' }, { status: 401 })
  }

  const result = await unsubscribeFromDigest({ userId: user?.id, token })
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Unsubscribe failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
