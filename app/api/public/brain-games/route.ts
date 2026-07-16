import { NextResponse } from 'next/server'
import { fetchBrainGamesForHub } from '@/lib/brain-training/hub-catalog'

export const dynamic = 'force-dynamic'

/** Public Arcade/homepage thumbnails — no auth. */
export async function GET() {
  try {
    const games = await fetchBrainGamesForHub()
    return NextResponse.json(
      { games },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    )
  } catch {
    return NextResponse.json({ games: [] }, { status: 200 })
  }
}
