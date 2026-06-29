import type { ComponentType } from 'react'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAdminSession } from '@/app/actions/admin-context'
import { findNavItem } from '@/lib/admin/nav'
import { hasPermission } from '@/lib/admin/permissions'

const SECTIONS: Record<string, ComponentType> = {
  users: dynamic(() => import('@/components/admin/user-management')),
  roles: dynamic(() => import('@/components/admin/roles-permissions')),
  applications: dynamic(() => import('@/components/admin/applications-management')),
  payments: dynamic(() => import('@/components/admin/payment-verification')),
  services: dynamic(() => import('@/components/admin/service-management')),
  courses: dynamic(() => import('@/components/admin/course-management')),
  enrollments: dynamic(() => import('@/components/admin/enrollment-management')),
  webinars: dynamic(() => import('@/components/admin/webinar-management')),
  announcements: dynamic(() => import('@/components/admin/announcement-management')),
  products: dynamic(() => import('@/components/admin/product-management')),
  stock: dynamic(() => import('@/components/admin/stock-management')),
  orders: dynamic(() => import('@/components/admin/order-management')),
  categories: dynamic(() => import('@/components/admin/category-management')),
  support: dynamic(() => import('@/components/admin/support-management')),
  'support-plans': dynamic(() => import('@/components/admin/support-plan-management')),
  reports: dynamic(() => import('@/components/admin/reports-tab')),
  settings: dynamic(() => import('@/components/admin/settings-panel')),
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const session = await getAdminSession()
  if (!session) {
    redirect('/auth/login')
  }

  const navItem = findNavItem(section)
  if (!navItem || !hasPermission(session.user.permissions, navItem.permission)) {
    notFound()
  }

  const SectionComponent = SECTIONS[section]
  if (!SectionComponent) {
    notFound()
  }

  return <SectionComponent />
}
