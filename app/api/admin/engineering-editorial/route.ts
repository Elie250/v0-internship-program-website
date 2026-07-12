import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { loadEditorialSummary } from '@/lib/engineering/queries'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    const summary = await loadEditorialSummary()
    return NextResponse.json(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load editorial summary'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
