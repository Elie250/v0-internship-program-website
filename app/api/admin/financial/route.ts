import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/actions/admin-context'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { loadFinancialSummary } from '@/lib/admin/data/financial-analytics'

export async function GET() {
  const session = await getAdminSession()
  if (!session || !hasPermission(session.user.permissions, PERMISSIONS.REPORTS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await loadFinancialSummary()
  return NextResponse.json(summary)
}
