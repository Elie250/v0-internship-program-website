import { NextResponse } from 'next/server'
import { recordLibraryItemView } from '@/lib/library/queries'

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    await recordLibraryItemView(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record view'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
