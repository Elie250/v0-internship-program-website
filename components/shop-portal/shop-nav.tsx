'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShopNavItem } from '@/lib/shop/portal-nav'

const ICONS: Record<ShopNavItem['icon'], LucideIcon> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  products: Package,
  inventory: Warehouse,
  sales: Receipt,
  settings: Settings,
  users: Users,
}

export function ShopNav({
  items,
  onNavigate,
  className,
}: {
  items: ShopNavItem[]
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col gap-1', className)} aria-label="Shop navigation">
      {items.map((item) => {
        const Icon = ICONS[item.icon]
        const active =
          pathname === item.href ||
          pathname === `/manage${item.href}` ||
          pathname.startsWith(`${item.href}/`) ||
          pathname.startsWith(`/manage${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy,#1e3a5f)]/40',
              active
                ? 'bg-[var(--brand-navy,#1e3a5f)] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
