import { NextResponse } from 'next/server'

/**
 * Vercel Cron invocations include `x-vercel-cron-schedule` and/or User-Agent `vercel-cron/1.0`.
 * @see https://vercel.com/docs/cron-jobs
 */
export function isVercelCronRequest(request: Request): boolean {
  const schedule = request.headers.get('x-vercel-cron-schedule')
  if (schedule) return true

  const userAgent = request.headers.get('user-agent') ?? ''
  return userAgent.includes('vercel-cron')
}

/** Block manual/browser/curl triggers in deployed environments. */
export function assertVercelCron(request: Request): NextResponse | null {
  if (process.env.NODE_ENV === 'development') return null

  if (!isVercelCronRequest(request)) {
    return NextResponse.json(
      { error: 'Forbidden — Vercel Cron only' },
      { status: 403 }
    )
  }

  return null
}
