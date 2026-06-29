'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { filterAdminNav } from '@/lib/admin/nav'
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  parseStoredPermissions,
  resolvePermissions,
  PERMISSIONS,
  type Permission,
} from '@/lib/admin/permissions'

export type RoleMatrixRow = {
  role: string
  label: string
  description: string
  canAccessAdmin: boolean
  permissions: Permission[]
  navSections: string[]
}

export type StaffUserPermissions = {
  id: string
  email: string
  name: string
  role: string
  status: string
  roleDefaults: Permission[]
  customPermissions: string[]
  effectivePermissions: Permission[]
}

export async function getRolesPermissionsData(): Promise<
  | {
      success: true
      groups: typeof PERMISSION_GROUPS
      matrix: RoleMatrixRow[]
      staffUsers: StaffUserPermissions[]
    }
  | { success: false; error: string }
> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ASSIGN_ROLE)

    const matrix: RoleMatrixRow[] = ROLE_DEFINITIONS.map((role) => {
      const permissions = getPermissionsForRole(role.slug)
      const nav = filterAdminNav(permissions)
      return {
        role: role.slug,
        label: role.label,
        description: role.description,
        canAccessAdmin: role.canAccessAdmin,
        permissions,
        navSections: nav.flatMap((group) => group.items.map((item) => item.label)),
      }
    })

    let staffUsers: StaffUserPermissions[] = []
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role, status, permissions')
        .neq('role', 'student')
        .order('role')
        .order('email')

      staffUsers = (data ?? [])
        .filter((user) => {
          const def = ROLE_DEFINITIONS.find((r) => r.slug === user.role)
          return def?.canAccessAdmin ?? false
        })
        .map((user) => {
          const custom = parseStoredPermissions(user.permissions)
          const roleDefaults = getPermissionsForRole(user.role)
          const effectivePermissions = resolvePermissions(user.role, user.permissions)
          return {
            id: user.id,
            email: user.email,
            name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
            role: user.role,
            status: user.status ?? 'active',
            roleDefaults,
            customPermissions: custom,
            effectivePermissions,
          }
        })
    }

    return { success: true, groups: PERMISSION_GROUPS, matrix, staffUsers }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load roles data',
    }
  }
}

export async function updateUserCustomPermissions(
  userId: string,
  permissions: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ASSIGN_ROLE)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const valid = permissions.filter((p): p is Permission =>
      (ALL_PERMISSIONS as string[]).includes(p)
    )

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        permissions: valid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      if (error.message.includes('permissions')) {
        return {
          success: false,
          error: 'permissions column missing — run scripts/00-create-users-table.sql in Supabase',
        }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update permissions',
    }
  }
}

export async function resetUserPermissionsToRole(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ASSIGN_ROLE)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return { success: false, error: 'User not found' }
    }

    const defaults = getPermissionsForRole(user.role)

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        permissions: defaults,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset permissions',
    }
  }
}
