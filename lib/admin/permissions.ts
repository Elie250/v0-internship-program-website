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
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_APPROVE: 'payments:approve',
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

export type PermissionMeta = {
  key: Permission
  label: string
  description: string
}

export type PermissionGroup = {
  id: string
  label: string
  permissions: PermissionMeta[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'core',
    label: 'Core access',
    permissions: [
      { key: PERMISSIONS.ADMIN_ACCESS, label: 'Admin panel', description: 'Sign in and open the admin dashboard' },
      { key: PERMISSIONS.REPORTS_VIEW, label: 'Reports & overview', description: 'View dashboard stats and reports' },
      { key: PERMISSIONS.SETTINGS_MANAGE, label: 'System settings', description: 'Branding, company info, and platform settings' },
    ],
  },
  {
    id: 'users',
    label: 'User management',
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: 'View users', description: 'List and search platform accounts' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Create users', description: 'Add new user accounts' },
      { key: PERMISSIONS.USERS_EDIT, label: 'Edit users', description: 'Update profiles and reset passwords' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete users', description: 'Remove user accounts' },
      { key: PERMISSIONS.USERS_ACTIVATE, label: 'Activate / suspend', description: 'Change account active status' },
      { key: PERMISSIONS.USERS_ASSIGN_ROLE, label: 'Roles & permissions', description: 'Assign roles and custom permission sets' },
    ],
  },
  {
    id: 'applications',
    label: 'Applications & admissions',
    permissions: [
      { key: PERMISSIONS.APPLICATIONS_VIEW, label: 'View applications', description: 'See program and registration submissions' },
      { key: PERMISSIONS.APPLICATIONS_APPROVE, label: 'Approve / decline', description: 'Accept or reject applicants' },
      { key: PERMISSIONS.APPLICATIONS_MANAGE, label: 'Manage applications', description: 'Bulk actions and application cleanup' },
      { key: PERMISSIONS.PAYMENTS_VIEW, label: 'View payments', description: 'See MoMo receipt submissions' },
      { key: PERMISSIONS.PAYMENTS_APPROVE, label: 'Approve payments', description: 'Verify receipts and admit students' },
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    permissions: [
      { key: PERMISSIONS.LEARNING_PROGRAMS, label: 'Courses & webinars', description: 'Create courses, lessons, and webinars' },
      { key: PERMISSIONS.LEARNING_STUDENTS, label: 'Enrollments', description: 'Manage student enrollments and admission status' },
    ],
  },
  {
    id: 'shop',
    label: 'Shop',
    permissions: [
      { key: PERMISSIONS.SHOP_PRODUCTS, label: 'Products & stock', description: 'Manage catalog and inventory' },
      { key: PERMISSIONS.SHOP_ORDERS, label: 'Orders', description: 'View and fulfil customer orders' },
      { key: PERMISSIONS.SHOP_CATEGORIES, label: 'Categories', description: 'Organise shop categories' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    permissions: [
      { key: PERMISSIONS.CONTENT_ANNOUNCEMENTS, label: 'Announcements', description: 'Publish news and notices' },
      { key: PERMISSIONS.CONTENT_SERVICES, label: 'Services', description: 'Manage engineering services listings' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    permissions: [
      { key: PERMISSIONS.SUPPORT_TICKETS, label: 'Support tickets', description: 'Handle engineering support requests' },
    ],
  },
]

export type RoleDefinition = {
  slug: string
  label: string
  description: string
  canAccessAdmin: boolean
  isSystem: boolean
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    slug: 'admin',
    label: 'Super Administrator',
    description: 'Full access to every module — users, shop, learning, payments, and settings.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'support_staff',
    label: 'Support Staff',
    description: 'Front-line support: tickets, applications, payments, and read-only user lookup.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'engineer',
    label: 'Engineer',
    description: 'Engineering support portal staff — tickets, applications, and service content.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'lecturer',
    label: 'Lecturer',
    description: 'Instructor access — courses, enrollments, announcements, and applicant review.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'instructor',
    label: 'Instructor',
    description: 'Same learning-focused access as lecturer for programme delivery.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'mentor',
    label: 'Mentor',
    description: 'Career mentorship — view and approve applications, limited admin visibility.',
    canAccessAdmin: true,
    isSystem: true,
  },
  {
    slug: 'student',
    label: 'Student',
    description: 'Learner account — student portal only, no admin panel.',
    canAccessAdmin: false,
    isSystem: true,
  },
  {
    slug: 'registered',
    label: 'Registered user',
    description: 'General registered account — public site and student portal when enrolled.',
    canAccessAdmin: false,
    isSystem: true,
  },
]

/** Default permission sets per role (merged with users.permissions JSONB). */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  support_staff: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_APPROVE,
    PERMISSIONS.APPLICATIONS_MANAGE,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_APPROVE,
    PERMISSIONS.SUPPORT_TICKETS,
    PERMISSIONS.LEARNING_STUDENTS,
  ],
  engineer: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SUPPORT_TICKETS,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_MANAGE,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.CONTENT_SERVICES,
    PERMISSIONS.USERS_VIEW,
  ],
  lecturer: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LEARNING_PROGRAMS,
    PERMISSIONS.LEARNING_STUDENTS,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_APPROVE,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  ],
  instructor: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LEARNING_PROGRAMS,
    PERMISSIONS.LEARNING_STUDENTS,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  ],
  mentor: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_APPROVE,
    PERMISSIONS.USERS_VIEW,
  ],
  student: [],
  registered: [],
}

export function getRoleDefinition(slug: string): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((role) => role.slug === slug)
}

export function getPermissionsForRole(role: string): Permission[] {
  if (role === 'admin') return ALL_PERMISSIONS
  return ROLE_PERMISSIONS[role] ?? []
}

export function parseStoredPermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

export function resolvePermissions(role: string, stored: unknown): Permission[] {
  const rolePerms = getPermissionsForRole(role)
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

export function permissionLabel(key: string): string {
  for (const group of PERMISSION_GROUPS) {
    const match = group.permissions.find((entry) => entry.key === key)
    if (match) return match.label
  }
  return key
}
