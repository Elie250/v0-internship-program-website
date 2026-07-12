import { NextResponse } from 'next/server'
import { sendLeadershipReportEmail } from '@/lib/email/leadership-report'
import { assertVercelCron } from '@/lib/cron/verify-vercel-cron'

export const dynamic = 'force-dynamic'

/** Vercel Cron — weekly leadership summary to configured admin emails. */
export async function GET(request: Request) {
  const denied = assertVercelCron(request)
  if (denied) return denied

  const result = await sendLeadershipReportEmail()
  return NextResponse.json(result)
}
