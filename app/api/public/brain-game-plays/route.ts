import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  isBrainPlayEvent,
  normalizeGameSlug,
  normalizeTrafficSource,
} from '@/lib/brain-training/engagement'

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 })
    }

    const body = (await request.json().catch(() => null)) as {
      event?: unknown
      gameSlug?: unknown
      trafficSource?: unknown
      visitorKey?: unknown
      isGuest?: unknown
      path?: unknown
    } | null

    if (!body || !isBrainPlayEvent(body.event)) {
      return NextResponse.json({ ok: false, error: 'Invalid event' }, { status: 400 })
    }

    const visitorKey =
      typeof body.visitorKey === 'string' ? body.visitorKey.trim().slice(0, 80) : ''
    if (visitorKey.length < 8) {
      return NextResponse.json({ ok: false, error: 'Invalid visitor key' }, { status: 400 })
    }

    const gameSlug = normalizeGameSlug(body.gameSlug)
    if (body.event !== 'hub_view' && gameSlug === 'hub') {
      return NextResponse.json({ ok: false, error: 'gameSlug required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('brain_game_plays').insert({
      game_slug: body.event === 'hub_view' ? 'hub' : gameSlug,
      event: body.event,
      traffic_source: normalizeTrafficSource(body.trafficSource),
      is_guest: body.isGuest !== false,
      visitor_key: visitorKey,
      path: typeof body.path === 'string' ? body.path.slice(0, 200) : null,
    })

    if (error) {
      const missing =
        /brain_game_plays|schema cache|does not exist/i.test(error.message || '')
      return NextResponse.json(
        {
          ok: false,
          error: missing
            ? 'Run scripts/65-brain-game-engagement.sql in Supabase'
            : error.message,
        },
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
