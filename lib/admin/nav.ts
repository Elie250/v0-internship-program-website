import { PERMISSIONS, type Permission, hasPermission } from '@/lib/admin/permissions'

export type AdminNavIconName =
  | 'layout-dashboard'
  | 'users'
  | 'shield'
  | 'clipboard-list'
  | 'receipt'
  | 'shopping-bag'
  | 'package'
  | 'warehouse'
  | 'folder-tree'
  | 'book-open'
  | 'graduation-cap'
  | 'video'
  | 'megaphone'
  | 'zap'
  | 'headphones'
  | 'bar-chart'
  | 'settings'

export type AdminNavItem = {
  id: string
  label: string
  href: string
  icon: AdminNavIconName
  permission: Permission
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin/dashboard',
        icon: 'layout-dashboard',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
    ],
  },
  {
    label: 'Users',
    items: [
      {
        id: 'users',
        label: 'All Users',
        href: '/admin/dashboard/users',
        icon: 'users',
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        href: '/admin/dashboard/roles',
        icon: 'shield',
        permission: PERMISSIONS.USERS_ASSIGN_ROLE,
      },
    ],
  },
  {
    label: 'Applications',
    items: [
      {
        id: 'applications',
        label: 'All Applications',
        href: '/admin/dashboard/applications',
        icon: 'clipboard-list',
        permission: PERMISSIONS.APPLICATIONS_VIEW,
      },
      {
        id: 'payments',
        label: 'Shop payments',
        href: '/admin/dashboard/payments',
        icon: 'receipt',
        permission: PERMISSIONS.PAYMENTS_VIEW,
      },
    ],
  },
  {
    label: 'Shop',
    items: [
      {
        id: 'products',
        label: 'Products',
        href: '/admin/dashboard/products',
        icon: 'shopping-bag',
        permission: PERMISSIONS.SHOP_PRODUCTS,
      },
      {
        id: 'stock',
        label: 'Stock',
        href: '/admin/dashboard/stock',
        icon: 'warehouse',
        permission: PERMISSIONS.SHOP_PRODUCTS,
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/admin/dashboard/orders',
        icon: 'package',
        permission: PERMISSIONS.SHOP_ORDERS,
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
    label: 'Learning',
    items: [
      {
        id: 'courses',
        label: 'Programs / Courses',
        href: '/admin/dashboard/courses',
        icon: 'book-open',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
      },
      {
        id: 'enrollments',
        label: 'Enrollments',
        href: '/admin/dashboard/enrollments',
        icon: 'graduation-cap',
        permission: PERMISSIONS.LEARNING_STUDENTS,
      },
      {
        id: 'webinars',
        label: 'Webinars',
        href: '/admin/dashboard/webinars',
        icon: 'video',
        permission: PERMISSIONS.LEARNING_PROGRAMS,
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        id: 'announcements',
        label: 'Announcements',
        href: '/admin/dashboard/announcements',
        icon: 'megaphone',
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/dashboard/services',
        icon: 'zap',
        permission: PERMISSIONS.CONTENT_SERVICES,
      },
    ],
  },
  {
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
        icon: 'users',
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
        id: 'settings',
        label: 'Settings',
        href: '/admin/dashboard/settings',
        icon: 'settings',
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
    ],
  },
]

export function filterAdminNav(
  permissions: string[] | undefined
): AdminNavGroup[] {
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
