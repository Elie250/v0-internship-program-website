import { PERMISSIONS, type Permission, hasPermission } from '@/lib/admin/permissions'

export type AdminNavIconName =
  | 'layout-dashboard'
  | 'users'
  | 'graduation-cap'
  | 'user-cog'
  | 'hard-hat'
  | 'shield'
  | 'clipboard-list'
  | 'receipt'
  | 'award'
  | 'shopping-bag'
  | 'package'
  | 'warehouse'
  | 'folder-tree'
  | 'book-open'
  | 'video'
  | 'monitor'
  | 'megaphone'
  | 'globe'
  | 'zap'
  | 'headphones'
  | 'bar-chart'
  | 'settings'
  | 'mail'
  | 'star'

export type AdminNavItem = {
  id: string
  label: string
  href: string
  icon: AdminNavIconName
  permission: Permission
  description?: string
}

export type AdminNavGroup = {
  id: string
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'overview',
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: 'layout-dashboard',
        permission: PERMISSIONS.REPORTS_VIEW,
        description: 'Platform snapshot and action items',
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      {
        id: 'students',
        label: 'Students',
        href: '/admin/dashboard/students',
        icon: 'graduation-cap',
        permission: PERMISSIONS.LEARNING_STUDENTS,
        description: 'Student accounts, enrollments, and contact details',
      },
      {
        id: 'lecturers',
        label: 'Lecturers',
        href: '/admin/dashboard/lecturers',
        icon: 'user-cog',
        permission: PERMISSIONS.USERS_VIEW,
        description: 'Teaching staff and assigned programmes',
      },
      {
        id: 'engineers',
        label: 'Engineers',
        href: '/admin/dashboard/engineers',
        icon: 'hard-hat',
        permission: PERMISSIONS.USERS_VIEW,
        description: 'Engineering support accounts and subscriptions',
      },
      {
        id: 'users',
        label: 'Staff & accounts',
        href: '/admin/dashboard/users',
        icon: 'users',
        permission: PERMISSIONS.USERS_VIEW,
        description: 'All platform users, roles, and approvals',
      },
      {
        id: 'roles',
        label: 'Roles & permissions',
        href: '/admin/dashboard/roles',
        icon: 'shield',
        permission: PERMISSIONS.USERS_ASSIGN_ROLE,
      },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions & payments',
    items: [
      {
        id: 'applications',
        label: 'Applications',
        href: '/admin/dashboard/applications',
        icon: 'clipboard-list',
        permission: PERMISSIONS.APPLICATIONS_VIEW,
      },
      {
        id: 'enrollments',
        label: 'Enrollments',
        href: '/admin/dashboard/enrollments',
        icon: 'graduation-cap',
        permission: PERMISSIONS.LEARNING_STUDENTS,
      },
      {
        id: 'payments',
        label: 'E-learning payments',
        href: '/admin/dashboard/payments',
        icon: 'receipt',
        permission: PERMISSIONS.PAYMENTS_VIEW,
        description: 'Programme enrollment MoMo receipts — separate from product orders',
      },
      {
        id: 'certificates',
        label: 'Certificates',
        href: '/admin/dashboard/certificates',
        icon: 'award',
        permission: PERMISSIONS.LEARNING_STUDENTS,
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Products & sales',
    items: [
      {
        id: 'products',
        label: 'Products catalog',
        href: '/admin/dashboard/products',
        icon: 'shopping-bag',
        permission: PERMISSIONS.SHOP_PRODUCTS,
      },
      {
        id: 'stock',
        label: 'Stock & inventory',
        href: '/admin/dashboard/stock',
        icon: 'warehouse',
        permission: PERMISSIONS.SHOP_PRODUCTS,
      },
      {
        id: 'orders',
        label: 'Product orders',
        href: '/admin/dashboard/orders',
        icon: 'package',
        permission: PERMISSIONS.SHOP_ORDERS,
        description: 'Orders with MoMo receipts — approve payment to confirm',
      },
      {
        id: 'pos',
        label: 'Point of Sale',
        href: '/admin/dashboard/pos',
        icon: 'shopping-bag',
        permission: PERMISSIONS.SHOP_ORDERS,
        description: 'In-store sales terminal with instant stock updates',
      },
      {
        id: 'financial',
        label: 'Financial overview',
        href: '/admin/dashboard/financial',
        icon: 'bar-chart',
        permission: PERMISSIONS.REPORTS_VIEW,
        description: 'Revenue, profit, and sales by channel — separate from e-learning',
      },
      {
        id: 'categories',
        label: 'Categories',
        href: '/admin/dashboard/categories',
        icon: 'folder-tree',
        permission: PERMISSIONS.SHOP_CATEGORIES,
      },
    ],
  },
  {
    id: 'learning',
    label: 'Learning & delivery',
    items: [
      {
        id: 'courses',
        label: 'Programs / courses',
        href: '/admin/dashboard/courses',
        icon: 'book-open',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
      },
      {
        id: 'webinars',
        label: 'Webinars',
        href: '/admin/dashboard/webinars',
        icon: 'video',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
      },
      {
        id: 'learning-analytics',
        label: 'Learning analytics',
        href: '/admin/dashboard/learning-analytics',
        icon: 'bar-chart',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
        description: 'Enrollments, progress, and delivery health by programme',
      },
      {
        id: 'classroom',
        label: 'Classroom monitor',
        href: '/admin/dashboard/classroom',
        icon: 'monitor',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
        description: 'Live sessions across all programmes',
      },
    ],
  },
  {
    id: 'public',
    label: 'Public website',
    items: [
      {
        id: 'announcements',
        label: 'Announcements',
        href: '/admin/dashboard/announcements',
        icon: 'megaphone',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
      },
      {
        id: 'engineering-articles',
        label: 'Field Notes',
        href: '/admin/dashboard/engineering-articles',
        icon: 'book-open',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
        description: 'Engineering blog articles on /engineering',
      },
      {
        id: 'engineering-series',
        label: 'Field Notes series',
        href: '/admin/dashboard/engineering-series',
        icon: 'folder-tree',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
        description: 'Multi-part article collections',
      },
      {
        id: 'engineering-lead-magnets',
        label: 'Field Notes PDFs',
        href: '/admin/dashboard/engineering-lead-magnets',
        icon: 'mail',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
        description: 'Free PDF guides with email capture',
      },
      {
        id: 'engineering-analytics',
        label: 'Field Notes analytics',
        href: '/admin/dashboard/engineering-analytics',
        icon: 'bar-chart',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
        description: 'Article view counts',
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/dashboard/services',
        icon: 'zap',
        permission: PERMISSIONS.CONTENT_SERVICES,
      },
      {
        id: 'reviews',
        label: 'Reviews & ratings',
        href: '/admin/dashboard/reviews',
        icon: 'star',
        permission: PERMISSIONS.CONTENT_SERVICES,
      },
      {
        id: 'settings',
        label: 'Site & branding',
        href: '/admin/dashboard/settings',
        icon: 'globe',
        permission: PERMISSIONS.SETTINGS_MANAGE,
        description: 'Hero, about, SEO, and company details',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        id: 'support',
        label: 'Tickets',
        href: '/admin/dashboard/support',
        icon: 'headphones',
        permission: PERMISSIONS.SUPPORT_TICKETS,
      },
      {
        id: 'engineer-subscriptions',
        label: 'Engineer subscriptions',
        href: '/admin/dashboard/engineer-subscriptions',
        icon: 'receipt',
        permission: PERMISSIONS.SUPPORT_TICKETS,
      },
      {
        id: 'support-plans',
        label: 'Support plans',
        href: '/admin/dashboard/support-plans',
        icon: 'zap',
        permission: PERMISSIONS.SUPPORT_TICKETS,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/admin/dashboard/reports',
        icon: 'bar-chart',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        id: 'communications',
        label: 'Email communications',
        href: '/admin/dashboard/communications',
        icon: 'mail',
        permission: PERMISSIONS.USERS_EDIT,
      },
    ],
  },
]

export type AdminMobileHub = {
  id: string
  label: string
  href: string
  icon: AdminNavIconName
  groupIds: string[]
}

/** Bottom navigation hubs for mobile admin (maps to nav groups). */
export const ADMIN_MOBILE_HUBS: AdminMobileHub[] = [
  {
    id: 'overview',
    label: 'Home',
    href: '/admin/dashboard',
    icon: 'layout-dashboard',
    groupIds: ['overview'],
  },
  {
    id: 'people',
    label: 'People',
    href: '/admin/dashboard/students',
    icon: 'users',
    groupIds: ['people'],
  },
  {
    id: 'commerce',
    label: 'Products',
    href: '/admin/dashboard/products',
    icon: 'shopping-bag',
    groupIds: ['commerce'],
  },
  {
    id: 'learning',
    label: 'Learning',
    href: '/admin/dashboard/courses',
    icon: 'book-open',
    groupIds: ['learning'],
  },
  {
    id: 'public',
    label: 'Public',
    href: '/admin/dashboard/announcements',
    icon: 'globe',
    groupIds: ['public', 'admissions', 'support', 'system'],
  },
]

export function filterAdminNav(permissions: string[] | undefined): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(permissions, item.permission)),
  })).filter((group) => group.items.length > 0)
}

export function findNavItem(section: string): AdminNavItem | undefined {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((entry) => entry.id === section)
    if (item) return item
  }
  return undefined
}

export function resolveSectionFromPathname(pathname: string): string | null {
  if (pathname === '/admin/dashboard') return 'overview'
  const match = pathname.match(/^\/admin\/dashboard\/([^/]+)/)
  return match?.[1] ?? null
}

export function findNavGroupForSection(section: string): AdminNavGroup | undefined {
  return ADMIN_NAV.find((group) => group.items.some((item) => item.id === section))
}

export function filterMobileHubs(
  permissions: string[] | undefined
): AdminMobileHub[] {
  const filteredNav = filterAdminNav(permissions)
  const visibleGroupIds = new Set(filteredNav.map((g) => g.id))

  return ADMIN_MOBILE_HUBS.filter((hub) =>
    hub.groupIds.some((groupId) => visibleGroupIds.has(groupId))
  ).map((hub) => {
    const firstVisibleGroup = hub.groupIds.find((id) => visibleGroupIds.has(id))
    if (!firstVisibleGroup) return hub
    const group = filteredNav.find((g) => g.id === firstVisibleGroup)
    const firstItem = group?.items[0]
    if (!firstItem) return hub
    return { ...hub, href: firstItem.href }
  })
}
