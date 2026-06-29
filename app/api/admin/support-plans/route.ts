import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  deleteSupportPlan,
  queryAllSupportPlans,
  upsertSupportPlan,
} from '@/lib/admin/data/support-plans'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const { plans, error } = await queryAllSupportPlans()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(plans)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const body = await request.json()
    const { plan, error } = await upsertSupportPlan(body)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(plan)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Plan id required' }, { status: 400 })
    const { error } = await deleteSupportPlan(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
