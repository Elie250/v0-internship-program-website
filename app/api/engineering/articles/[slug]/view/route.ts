import { NextResponse } from 'next/server'
import { incrementArticleView } from '@/lib/engineering/queries'

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  try {
    await incrementArticleView(slug)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
