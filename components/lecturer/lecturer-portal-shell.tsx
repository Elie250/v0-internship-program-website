'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Calculator,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Menu,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { NotificationBadge } from '@/components/ui/notification-badge'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/app/actions/auth-service'
import { COMPANY } from '@/lib/company/constants'

const nav = [
  { id: 'programmes', href: '/lecturer/dashboard', label: 'My programmes', icon: GraduationCap, match: 'programmes' as const },
  { id: 'students', href: '/lecturer/students', label: 'Students', icon: Users, match: 'students' as const },
  { id: 'library', href: '/lecturer/library', label: 'Library', icon: Library, match: 'library' as const },
  { id: 'tools', href: '/lecturer/tools', label: 'Tools', icon: Calculator, match: 'tools' as const },
  { id: 'profile', href: '/lecturer/profile', label: 'Profile', icon: User, match: 'profile' as const },
]

function useNavActive(pathname: string) {
  return (item: (typeof nav)[0]) => {
    if (item.match === 'programmes') {
      return pathname === '/lecturer/dashboard' || pathname.startsWith('/lecturer/courses/')
    }
    if (item.match === 'students') return pathname.startsWith('/lecturer/students')
    if (item.match === 'library') return pathname.startsWith('/lecturer/library')
    if (item.match === 'tools') return pathname.startsWith('/lecturer/tools')
    if (item.match === 'profile') return pathname.startsWith('/lecturer/profile')
    return false
  }
}

function LecturerSidebarContent({
  pathname,
  badges,
  onNavigate,
  onLogout,
}: {
  pathname: string
  badges: Record<string, number>
  onNavigate?: () => void
  onLogout: () => void
}) {
  const isActive = useNavActive(pathname)

  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const count = badges[item.id] ?? 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition no-underline hover:no-underline min-h-[44px]',
                active
                  ? 'bg-white text-[var(--brand-navy)] font-semibold shadow-sm'
                  : 'hover:bg-white/15 text-white font-medium hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-[var(--brand-navy)]' : 'text-white')} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? (
                <NotificationBadge
                  count={count}
                  size="sm"
                  className={active ? 'ring-[var(--brand-navy)]/20' : 'ring-[var(--brand-navy)]'}
                />
              ) : null}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/25 space-y-1">
        <Link href="/engineering-support" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white hover:text-white hover:bg-white/15 min-h-[44px] text-sm font-medium"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Engineering support
          </Button>
        </Link>
        <Link href="/" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white hover:text-white hover:bg-white/15 min-h-[44px] text-sm font-medium"
          >
            <Home className="h-5 w-5 mr-2" />
            Public site
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-white hover:text-white hover:bg-white/15 min-h-[44px] text-sm font-medium"
          onClick={() => {
            onNavigate?.()
            onLogout()
          }}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>
    </>
  )
}

export function LecturerPortalShell({
  userName,
  children,
  headerAction,
}: {
  userName: string
  children: React.ReactNode
  headerAction?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/lecturer/nav-badges', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.badges) setBadges(data.badges)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pathname])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const closeMobile = () => setMobileOpen(false)
  const mobileBadgeTotal =
    (badges.programmes ?? 0) + (badges.students ?? 0) + (badges.library ?? 0)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="lecturer-portal-sidebar text-on-dark hidden md:flex w-64 flex-col bg-[var(--brand-navy)] shrink-0 border-r border-white/20">
        <div className="p-5 border-b border-white/25">
          <p className="font-bold text-lg text-white">{COMPANY.platformName}</p>
          <p className="text-xs text-white/90 font-medium mt-1">Lecturer portal</p>
        </div>
        <LecturerSidebarContent pathname={pathname} badges={badges} onLogout={handleLogout} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="relative shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 h-10 w-10 p-0 border-slate-300 text-[var(--brand-navy)]"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {mobileBadgeTotal > 0 ? (
                <NotificationBadge
                  count={mobileBadgeTotal}
                  size="sm"
                  className="absolute -top-1.5 -right-1.5 ring-white"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-600 leading-tight font-medium">Lecturer portal</p>
              <p className="font-semibold text-slate-950 text-sm truncate">{userName}</p>
            </div>
          </div>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="lecturer-mobile-nav w-[min(100vw-2rem,20rem)] p-0 border-0 bg-[var(--brand-navy)] text-white [&>[data-slot=sheet-close]]:text-white [&>[data-slot=sheet-close]]:opacity-90 [&>[data-slot=sheet-close]]:hover:bg-white/10 [&>[data-slot=sheet-close]]:top-4 [&>[data-slot=sheet-close]]:right-4"
          >
            <SheetHeader className="border-b border-white/25 px-4 py-4 pr-12 text-left">
              <SheetTitle className="text-white text-left">
                <span className="block font-bold text-lg">{COMPANY.platformName}</span>
                <span className="block text-xs font-normal text-white/90 mt-0.5">Lecturer portal</span>
              </SheetTitle>
              <p className="text-sm text-white/90 truncate pt-1">{userName}</p>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100%-5.5rem)] overflow-y-auto">
              <LecturerSidebarContent
                pathname={pathname}
                badges={badges}
                onNavigate={closeMobile}
                onLogout={handleLogout}
              />
            </div>
          </SheetContent>
        </Sheet>

        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
          <div>
            <p className="text-sm text-slate-700">Welcome back</p>
            <p className="font-semibold text-slate-950">{userName}</p>
          </div>
          {headerAction ?? (
            <Link href="/lecturer/dashboard">
              <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                My programmes
              </Button>
            </Link>
          )}
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto app-form-surface">{children}</main>
      </div>
    </div>
  )
}
