import { NextResponse } from 'next/server'
import { recordLeadMagnetDownload } from '@/lib/engineering/queries'

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const body = await request.json()
    const result = await recordLeadMagnetDownload({
      slug,
      email: String(body.email ?? ''),
      name: body.name != null ? String(body.name) : null,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Download failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, fileUrl: result.fileUrl })
  } catch {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
