import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryAssignableMentors, queryMentorsRegistry } from '@/lib/admin/data/mentors-registry'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined
    const assignableOnly = searchParams.get('assignable') === '1'

    if (assignableOnly) {
      const { mentors, error } = await queryAssignableMentors()
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json(mentors)
    }

    const { mentors, error } = await queryMentorsRegistry({ search })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(mentors)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
