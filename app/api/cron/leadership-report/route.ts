import { NextResponse } from 'next/server'
import { sendLeadershipReportEmail } from '@/lib/email/leadership-report'

export const dynamic = 'force-dynamic'

/** Vercel Cron — weekly leadership summary to configured admin emails. */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendLeadershipReportEmail()
  return NextResponse.json(result)
}
