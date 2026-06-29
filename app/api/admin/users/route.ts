import { NextRequest, NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAdminUsers } from '@/lib/admin/data/users'
import { PERMISSIONS } from '@/lib/admin/permissions'
import type { AdminUserRole } from '@/lib/admin/user-roles'
import {
  approveStaffAccountMutation,
  createUserMutation,
  deleteUserMutation,
  resetUserPasswordMutation,
  updateUserMutation,
  updateUserStatusMutation,
} from '@/lib/admin/user-mutations'

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    const params = request.nextUrl.searchParams
    const { users, error } = await queryAdminUsers({
      search: params.get('search') ?? undefined,
      role: params.get('role') ?? undefined,
      status: params.get('status') ?? undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(users)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

type UserActionBody = {
  action: string
  id?: string
  status?: 'active' | 'inactive' | 'suspended' | 'pending_approval'
  email?: string
  firstName?: string
  lastName?: string
  password?: string
  newPassword?: string
  role?: AdminUserRole
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as UserActionBody
    const { action, id } = body

    if (!id) {
      return NextResponse.json({ error: 'User id required' }, { status: 400 })
    }

    switch (action) {
      case 'approve': {
        await requireAdminPermission(PERMISSIONS.USERS_ACTIVATE)
        const result = await approveStaffAccountMutation(id)
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'Approval failed' }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: 'Account approved and activated' })
      }

      case 'status': {
        await requireAdminPermission(PERMISSIONS.USERS_ACTIVATE)
        if (!body.status) {
          return NextResponse.json({ error: 'Status required' }, { status: 400 })
        }
        const result = await updateUserStatusMutation(id, body.status)
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'Status update failed' }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: `Status set to ${body.status}` })
      }

      case 'delete': {
        await requireAdminPermission(PERMISSIONS.USERS_DELETE)
        const result = await deleteUserMutation(id)
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'Delete failed' }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: 'User deleted' })
      }

      case 'reset_password': {
        await requireAdminPermission(PERMISSIONS.USERS_EDIT)
        if (!body.newPassword) {
          return NextResponse.json({ error: 'New password required' }, { status: 400 })
        }
        const result = await resetUserPasswordMutation(id, body.newPassword)
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'Password reset failed' }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: 'Password reset' })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_CREATE)
    const body = await request.json()

    const result = await createUserMutation({
      email: String(body.email ?? ''),
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      password: String(body.password ?? ''),
      role: body.role as AdminUserRole,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Create failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'User created' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_EDIT)
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'User id required' }, { status: 400 })
    }

    const result = await updateUserMutation({
      id: String(body.id),
      email: String(body.email ?? ''),
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      role: body.role as AdminUserRole,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Update failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'User updated' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
