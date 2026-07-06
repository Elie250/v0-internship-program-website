'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FolderTree,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mail,
  Megaphone,
  Receipt,
  Settings,
  Shield,
  Star,
  ShoppingBag,
  Package,
  Warehouse,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import type { AdminNavIconName } from '@/lib/admin/nav'

export const ADMIN_NAV_ICONS: Record<AdminNavIconName, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  shield: Shield,
  'clipboard-list': ClipboardList,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  package: Package,
  warehouse: Warehouse,
  'folder-tree': FolderTree,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  video: Video,
  megaphone: Megaphone,
  zap: Zap,
  headphones: Headphones,
  'bar-chart': BarChart3,
  settings: Settings,
  mail: Mail,
  star: Star,
}
