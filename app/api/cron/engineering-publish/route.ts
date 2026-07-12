import { NextResponse } from 'next/server'
import { publishScheduledArticles } from '@/lib/engineering/queries'
import { assertVercelCron } from '@/lib/cron/verify-vercel-cron'

export const dynamic = 'force-dynamic'

/** Vercel Cron — publishes articles whose scheduled_publish_at has passed. */
export async function GET(request: Request) {
  const denied = assertVercelCron(request)
  if (denied) return denied

  const result = await publishScheduledArticles()
  return NextResponse.json(result)
}
