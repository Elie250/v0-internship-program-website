import { NextResponse } from 'next/server'
import { sendEngineeringWeeklyDigest } from '@/lib/email/engineering-digest'
import { assertVercelCron } from '@/lib/cron/verify-vercel-cron'

export const dynamic = 'force-dynamic'

/** Vercel Cron — sends weekly Field Notes digest to subscribers. */
export async function GET(request: Request) {
  const denied = assertVercelCron(request)
  if (denied) return denied

  const result = await sendEngineeringWeeklyDigest()
  return NextResponse.json(result)
}
