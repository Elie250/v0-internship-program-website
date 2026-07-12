import { redirect, notFound } from 'next/navigation'
import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { getAdminSession } from '@/app/actions/admin-context'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryRole } from '@/lib/admin/access-control'
import { findNavItem } from '@/lib/admin/nav'
import { hasPermission } from '@/lib/admin/permissions'

const SECTIONS: Record<string, ComponentType> = {
  students: dynamic(() => import('@/components/admin/students-management')),
  lecturers: dynamic(() => import('@/components/admin/lecturers-management')),
  engineers: dynamic(() => import('@/components/admin/engineers-management')),
  users: dynamic(() => import('@/components/admin/user-management')),
  roles: dynamic(() => import('@/components/admin/roles-permissions')),
  applications: dynamic(() => import('@/components/admin/applications-management')),
  enrollments: dynamic(() => import('@/components/admin/enrollment-management')),
  payments: dynamic(() => import('@/components/admin/payments-hub')),
  certificates: dynamic(() => import('@/components/admin/certificates-management')),
  products: dynamic(() => import('@/components/admin/product-management')),
  stock: dynamic(() => import('@/components/admin/stock-management')),
  orders: dynamic(() => import('@/components/admin/order-management')),
  categories: dynamic(() => import('@/components/admin/category-management')),
  financial: dynamic(() => import('@/components/admin/financial-management')),
  pos: dynamic(() => import('@/components/admin/pos-terminal')),
  courses: dynamic(() => import('@/components/admin/course-management')),
  webinars: dynamic(() => import('@/components/admin/webinar-management')),
  classroom: dynamic(() => import('@/components/admin/classroom-monitor-management')),
  'learning-analytics': dynamic(() => import('@/components/admin/learning-analytics-management')),
  announcements: dynamic(() => import('@/components/admin/announcement-management')),
  'engineering-articles': dynamic(() => import('@/components/admin/engineering-articles-management')),
  'engineering-series': dynamic(() => import('@/components/admin/engineering-series-management')),
  'engineering-lead-magnets': dynamic(() => import('@/components/admin/engineering-lead-magnets-management')),
  'engineering-analytics': dynamic(() => import('@/components/admin/engineering-analytics-management')),
  services: dynamic(() => import('@/components/admin/service-management')),
  reviews: dynamic(() => import('@/components/admin/review-management')),
  settings: dynamic(() => import('@/components/admin/settings-panel')),
  support: dynamic(() => import('@/components/admin/support-management')),
  'engineer-subscriptions': dynamic(() => import('@/components/admin/engineer-subscriptions-management')),
  'support-plans': dynamic(() => import('@/components/admin/support-plan-management')),
  reports: dynamic(() => import('@/components/admin/reports-tab')),
  communications: dynamic(() => import('@/components/admin/admin-communications')),
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const session = await getAdminSession()
  if (!session) {
    const user = await getCurrentUser()
    if (user && isDeliveryRole(user.role)) {
      redirect('/lecturer/dashboard')
    }
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
