import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FolderTree,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Settings,
  Shield,
  ShoppingBag,
  Users,
  Zap,
} from 'lucide-react'
import { PERMISSIONS, type Permission, hasPermission } from '@/lib/admin/permissions'

export type AdminNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
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
        icon: LayoutDashboard,
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
        icon: Users,
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        href: '/admin/dashboard/roles',
        icon: Shield,
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
        icon: ClipboardList,
        permission: PERMISSIONS.APPLICATIONS_VIEW,
      },
      {
        id: 'payments',
        label: 'Payment Receipts',
        href: '/admin/dashboard/payments',
        icon: Receipt,
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
        icon: ShoppingBag,
        permission: PERMISSIONS.SHOP_PRODUCTS,
      },
      {
        id: 'categories',
        label: 'Categories',
        href: '/admin/dashboard/categories',
        icon: FolderTree,
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
        icon: BookOpen,
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
        icon: Megaphone,
        permission: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/dashboard/services',
        icon: Zap,
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
        icon: Headphones,
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
        icon: BarChart3,
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/dashboard/settings',
        icon: Settings,
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
