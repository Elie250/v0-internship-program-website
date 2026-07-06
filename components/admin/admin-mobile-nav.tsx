'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import type { AdminMobileHub } from '@/lib/admin/nav'
import { ADMIN_NAV_ICONS } from '@/components/admin/admin-nav-icons'
import { cn } from '@/lib/utils'

function hubIsActive(pathname: string, hub: AdminMobileHub): boolean {
  if (hub.id === 'overview') return pathname === '/admin/dashboard'
  return hub.groupIds.some((groupId) => {
    const groupPrefixes: Record<string, string[]> = {
      people: ['students', 'lecturers', 'engineers', 'users', 'roles'],
      commerce: ['products', 'stock', 'orders', 'categories'],
      learning: ['courses', 'webinars', 'classroom', 'learning-analytics'],
      public: [
        'announcements',
        'services',
        'reviews',
        'settings',
        'applications',
        'enrollments',
        'payments',
        'certificates',
        'support',
        'engineer-subscriptions',
        'support-plans',
        'reports',
        'communications',
      ],
    }
    const sections = groupPrefixes[hub.id] ?? []
    return sections.some((section) => pathname.startsWith(`/admin/dashboard/${section}`))
  })
}

export function AdminMobileNav({ hubs }: { hubs: AdminMobileHub[] }) {
  const pathname = usePathname()

  if (hubs.length === 0) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 pb-[env(safe-area-inset-bottom)]"
      aria-label="Admin quick navigation"
    >
      <div className="grid grid-cols-5 gap-0">
        {hubs.map((hub) => {
          const Icon = ADMIN_NAV_ICONS[hub.icon]
          const active = hubIsActive(pathname, hub)

          return (
            <Link
              key={hub.id}
              href={hub.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 text-[10px] font-medium transition-colors',
                active
                  ? 'text-[var(--brand-navy)] bg-slate-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
              )}
            >
              {Icon ? <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} /> : null}
              <span className="truncate max-w-full">{hub.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function AdminMobileMenuButton() {
  return (
    <SidebarTrigger
      className="md:hidden text-slate-800 shrink-0"
      aria-label="Open admin menu"
    >
      <Menu className="h-5 w-5" />
    </SidebarTrigger>
  )
}
