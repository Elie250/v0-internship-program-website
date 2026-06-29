import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { querySupportTickets, updateSupportTicket } from '@/lib/admin/data/support-tickets'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const { tickets, error } = await querySupportTickets()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(tickets)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SUPPORT_TICKETS)
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Ticket id required' }, { status: 400 })
    }
    const { error } = await updateSupportTicket(body)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
