import { NextResponse } from 'next/server'
import { sendSessionReminders } from '@/lib/email/session-reminders'
import { assertVercelCron } from '@/lib/cron/verify-vercel-cron'

export const dynamic = 'force-dynamic'

/** Vercel Cron — sends 24h and 1h reminders for live sessions and webinars. */
export async function GET(request: Request) {
  const denied = assertVercelCron(request)
  if (denied) return denied

  const result = await sendSessionReminders()
  return NextResponse.json(result)
}
