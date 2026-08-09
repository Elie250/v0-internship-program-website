import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryStudentsRegistry } from '@/lib/admin/data/students-registry'
import {
  isStudentAccountEditsPeriodOpen,
  setStudentAccountEditsPeriodOpen,
  setStudentSelfEditLocked,
} from '@/lib/student/account-self-edit'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined

    const [{ students, error }, accountEditsOpen] = await Promise.all([
      queryStudentsRegistry({ search }),
      isStudentAccountEditsPeriodOpen(),
    ])
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ students, accountEditsOpen })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const body = (await request.json()) as {
      action?: string
      id?: string
      open?: boolean
      locked?: boolean
    }

    if (body.action === 'set_period') {
      const result = await setStudentAccountEditsPeriodOpen(Boolean(body.open))
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? 'Failed to update period' }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        accountEditsOpen: Boolean(body.open),
        message: body.open
          ? 'Registration period is open — students can edit name and password.'
          : 'Registration period is closed — student name and password edits are denied.',
      })
    }

    if (body.action === 'set_lock') {
      if (!body.id) {
        return NextResponse.json({ error: 'Student id required' }, { status: 400 })
      }
      const result = await setStudentSelfEditLocked(body.id, Boolean(body.locked))
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? 'Failed to update lock' }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        message: body.locked
          ? 'This student can no longer edit name or password.'
          : 'This student may edit name and password while registration is open.',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
