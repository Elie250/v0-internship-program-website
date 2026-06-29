import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAdminApplications } from '@/lib/admin/data/applications'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    const { applications, registrations, error } = await queryAdminApplications()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ applications, registrations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load applications'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
