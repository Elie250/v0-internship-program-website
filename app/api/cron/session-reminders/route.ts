import { NextResponse } from 'next/server'
import { sendSessionReminders } from '@/lib/email/session-reminders'

export const dynamic = 'force-dynamic'

/** Vercel Cron — sends 24h and 1h reminders for live sessions and webinars. */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendSessionReminders()
  return NextResponse.json(result)
}
