/** Module/action permissions for the admin panel (Phase 2 RBAC). */
export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin:access',
  REPORTS_VIEW: 'reports:view',
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_ACTIVATE: 'users:activate',
  USERS_ASSIGN_ROLE: 'users:assign_role',
  APPLICATIONS_VIEW: 'applications:view',
  APPLICATIONS_APPROVE: 'applications:approve',
  APPLICATIONS_MANAGE: 'applications:manage',
  SHOP_PRODUCTS: 'shop:products',
  SHOP_ORDERS: 'shop:orders',
  SHOP_CATEGORIES: 'shop:categories',
  LEARNING_PROGRAMS: 'learning:programs',
  LEARNING_STUDENTS: 'learning:students',
  CONTENT_ANNOUNCEMENTS: 'content:announcements',
  CONTENT_SERVICES: 'content:services',
  SUPPORT_TICKETS: 'support:tickets',
  SETTINGS_MANAGE: 'settings:manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

/** Default permission sets per role (merged with users.permissions JSONB). */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  support_staff: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SUPPORT_TICKETS,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  engineer: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SUPPORT_TICKETS,
    PERMISSIONS.APPLICATIONS_VIEW,
  ],
  lecturer: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LEARNING_PROGRAMS,
    PERMISSIONS.LEARNING_STUDENTS,
    PERMISSIONS.APPLICATIONS_VIEW,
  ],
  instructor: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LEARNING_PROGRAMS,
    PERMISSIONS.LEARNING_STUDENTS,
  ],
  mentor: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
  ],
}

export function parseStoredPermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

export function resolvePermissions(role: string, stored: unknown): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role] ?? []
  const custom = parseStoredPermissions(stored)

  if (role === 'admin') {
    return ALL_PERMISSIONS
  }

  const merged = new Set<string>([...rolePerms, ...custom])
  if (merged.has(PERMISSIONS.ADMIN_ACCESS) || rolePerms.length > 0) {
    merged.add(PERMISSIONS.ADMIN_ACCESS)
  }

  return ALL_PERMISSIONS.filter((permission) => merged.has(permission)) as Permission[]
}

export function hasPermission(
  permissions: string[] | undefined,
  required: Permission | Permission[]
): boolean {
  if (!permissions?.length) return false

  const requiredList = Array.isArray(required) ? required : [required]
  return requiredList.some((permission) => permissions.includes(permission))
}

export function canAccessAdminPanel(role: string, permissions?: string[]): boolean {
  if (role === 'admin') return true
  return hasPermission(permissions, PERMISSIONS.ADMIN_ACCESS)
}
