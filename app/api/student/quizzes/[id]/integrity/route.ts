import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { logAttemptIntegrityEvent } from '@/lib/learning/assessment-integrity'
import { normalizeEventType } from '@/lib/integrity/validate'

async function sessionUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; role: string }
  } catch {
    return null
  }
}

/** Record proctoring-style integrity signals during an active attempt. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assessmentId } = await params
  const body = await request.json()
  const attemptId = String(body.attemptId ?? '')
  const eventType = String(body.eventType ?? '')

  if (!attemptId || !normalizeEventType(eventType)) {
    return NextResponse.json({ error: 'Invalid integrity event' }, { status: 400 })
  }

  const hdrs = await headers()
  const result = await logAttemptIntegrityEvent({
    attemptId,
    userId: user.id,
    eventType,
    metadata: {
      assessmentId,
      ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
    },
    clientMeta: {
      userAgent: hdrs.get('user-agent'),
      ip: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip'),
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Attempt not active' },
      { status: result.error?.includes('Too many') ? 429 : 400 }
    )
  }

  // Never return integrity_band to students
  return NextResponse.json({ ok: true, tabSwitchCount: result.tabSwitchCount })
}
