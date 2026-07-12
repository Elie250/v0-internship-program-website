import { NextResponse } from 'next/server'
import { sendEngineeringWeeklyDigest } from '@/lib/email/engineering-digest'

export const dynamic = 'force-dynamic'

/** Vercel Cron — sends weekly Field Notes digest to subscribers. */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendEngineeringWeeklyDigest()
  return NextResponse.json(result)
}
