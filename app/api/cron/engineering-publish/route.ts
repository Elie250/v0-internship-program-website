import { NextResponse } from 'next/server'
import { publishScheduledArticles } from '@/lib/engineering/queries'

export const dynamic = 'force-dynamic'

/** Vercel Cron — publishes articles whose scheduled_publish_at has passed. */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await publishScheduledArticles()
  return NextResponse.json(result)
}
