import { NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/admin/access-control'
import { queryAssignableWebinarHosts } from '@/lib/admin/data/lecturers'

export async function GET() {
  try {
    await requirePlatformAdmin()
    const { hosts, error } = await queryAssignableWebinarHosts()
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json(hosts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Forbidden' || message === 'Unauthorized' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
