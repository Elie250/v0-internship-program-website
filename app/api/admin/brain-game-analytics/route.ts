import { NextResponse } from 'next/server'
import { checkUserPermission, getCurrentUser } from '@/app/actions/auth-service'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryBrainGameAnalytics } from '@/lib/brain-training/analytics'
import { querySiteTrafficAnalytics } from '@/lib/analytics/site-traffic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      const allowed = await checkUserPermission(user.id, PERMISSIONS.CONTENT_ANNOUNCEMENTS)
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const daysParam = Number(new URL(request.url).searchParams.get('days') || '30')
    const days = Number.isFinite(daysParam) ? Math.min(90, Math.max(7, daysParam)) : 30

    const [brain, site] = await Promise.all([
      queryBrainGameAnalytics(days),
      querySiteTrafficAnalytics(days),
    ])

    return NextResponse.json({
      success: true,
      days,
      ...brain,
      site,
      error: brain.error || site.error,
      missingTable: Boolean(brain.missingTable || site.missingTable),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
