import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryStudentsRegistry } from '@/lib/admin/data/students-registry'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined

    const { students, error } = await queryStudentsRegistry({ search })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(students)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
