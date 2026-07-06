import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAttemptIntegrityEvent } from '@/lib/learning/assessment-integrity'

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

const ALLOWED_EVENTS = new Set([
  'tab_hidden',
  'tab_visible',
  'window_blur',
  'window_focus',
  'paste_blocked',
  'copy_blocked',
  'context_menu_blocked',
  'fullscreen_exit',
])

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

  if (!attemptId || !ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: 'Invalid integrity event' }, { status: 400 })
  }

  const result = await logAttemptIntegrityEvent({
    attemptId,
    userId: user.id,
    eventType,
    metadata: {
      assessmentId,
      ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Attempt not active' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, tabSwitchCount: result.tabSwitchCount })
}
