import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { filterAdminNav } from '@/lib/admin/nav'
import {
  PERMISSION_GROUPS,
  ROLE_DEFINITIONS,
  getPermissionsForRole,
  parseStoredPermissions,
  resolvePermissions,
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

export async function queryRolesPermissionsData(): Promise<{
  groups: typeof PERMISSION_GROUPS
  matrix: RoleMatrixRow[]
  staffUsers: StaffUserPermissions[]
}> {
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
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, permissions')
      .order('role')
      .order('email')

    if (!error) {
      staffUsers = (data ?? [])
        .filter((user) => {
          const def = ROLE_DEFINITIONS.find((r) => r.slug === user.role)
          return def?.canAccessAdmin ?? false
        })
        .map((user) => {
          const custom = parseStoredPermissions(user.permissions)
          const roleDefaults = getPermissionsForRole(user.role)
          return {
            id: user.id,
            email: user.email,
            name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
            role: user.role,
            status: user.status ?? 'active',
            roleDefaults,
            customPermissions: custom,
            effectivePermissions: resolvePermissions(user.role, user.permissions),
          }
        })
    }
  }

  return { groups: PERMISSION_GROUPS, matrix, staffUsers }
}
