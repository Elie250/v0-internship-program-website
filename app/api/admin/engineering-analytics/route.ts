import { NextResponse } from 'next/server'
import { loadArticleAnalytics } from '@/lib/engineering/queries'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    const data = await loadArticleAnalytics()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load analytics'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
