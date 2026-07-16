import { NextResponse } from 'next/server'
import { recordSitePageview } from '@/lib/analytics/site-traffic'
import { normalizeTrafficSource } from '@/lib/brain-training/engagement'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      path?: unknown
      trafficSource?: unknown
      visitorKey?: unknown
    } | null

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
    }

    const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '/'
    const visitorKey =
      typeof body.visitorKey === 'string' ? body.visitorKey.trim().slice(0, 80) : ''

    const result = await recordSitePageview({
      path,
      trafficSource: normalizeTrafficSource(body.trafficSource),
      visitorKey,
    })

    if (!result.ok) {
      const missing = /66-site-traffic/i.test(result.error || '')
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: missing ? 503 : 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
