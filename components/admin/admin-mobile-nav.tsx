'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminMobileHub } from '@/lib/admin/nav'
import { ADMIN_NAV_ICONS } from '@/components/admin/admin-nav-icons'
import { cn } from '@/lib/utils'

function hubIsActive(pathname: string, hub: AdminMobileHub): boolean {
  if (hub.id === 'overview') return pathname === '/admin/dashboard'
  return hub.groupIds.some((groupId) => {
    const groupPrefixes: Record<string, string[]> = {
      people: ['students', 'lecturers', 'engineers', 'users', 'roles'],
      commerce: ['products', 'stock', 'orders', 'categories', 'financial', 'pos'],
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
        'energy-library',
        'engineering-articles',
        'engineering-series',
        'engineering-lead-magnets',
        'engineering-analytics',
        'engineering-editorial',
        'audit-log',
        'security',
        'mentor-requests',
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
      className="admin-mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-slate-300 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)]"
      aria-label="Admin quick navigation"
    >
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${hubs.length}, minmax(0, 1fr))` }}>
        {hubs.map((hub) => {
          const Icon = ADMIN_NAV_ICONS[hub.icon]
          const active = hubIsActive(pathname, hub)

          return (
            <Link
              key={hub.id}
              href={hub.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-2.5 px-1 min-h-[3.25rem] text-[10px] font-semibold transition-colors',
                active
                  ? 'text-[var(--brand-navy)] bg-slate-100'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              )}
            >
              {active ? (
                <span
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-[var(--brand-navy)]"
                  aria-hidden
                />
              ) : null}
              {Icon ? (
                <Icon
                  className={cn('h-5 w-5 shrink-0', active ? 'stroke-[2.5] text-[var(--brand-navy)]' : 'text-slate-700')}
                />
              ) : null}
              <span className="truncate max-w-full leading-tight">{hub.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
