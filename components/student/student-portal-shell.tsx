'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Award,
  BookOpen,
  Calculator,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  User,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/app/actions/auth-service'
import { useRouter } from 'next/navigation'
import { COMPANY } from '@/lib/company/constants'

const nav = [
  { href: '/student/dashboard', label: 'My learning', icon: GraduationCap, tab: 'courses' },
  { href: '/student/courses?track=training', label: 'Programs', icon: BookOpen },
  { href: '/student/dashboard?tab=webinars', label: 'Webinars', icon: Video, tab: 'webinars' },
  { href: '/student/tools', label: 'Tools', icon: Calculator },
  { href: '/student/dashboard?tab=announcements', label: 'Announcements', icon: Megaphone, tab: 'announcements' },
  { href: '/student/certificates', label: 'Certificates', icon: Award },
  { href: '/student/profile', label: 'Profile', icon: User },
]

function useStudentNavActive(pathname: string, tab: string) {
  return (item: (typeof nav)[0]) => {
    if (item.href.startsWith('/student/courses')) {
      return pathname.startsWith('/student/courses')
    }
    if (item.href === '/student/tools') return pathname.startsWith('/student/tools')
    if (item.href === '/student/certificates') return pathname.startsWith('/student/certificates')
    if (item.href === '/student/profile') return pathname.startsWith('/student/profile')
    if (item.tab && item.href.startsWith('/student/dashboard')) {
      if (pathname.startsWith('/student/courses/') && !pathname.endsWith('/enroll')) return false
      if (pathname.startsWith('/student/courses')) return false
      return pathname === '/student/dashboard' && tab === item.tab
    }
    if (item.href === '/student/dashboard') {
      return (
        (pathname === '/student/dashboard' && tab === 'courses') ||
        pathname.startsWith('/student/courses/')
      )
    }
    return pathname === item.href
  }
}

function StudentSidebarNav({
  pathname,
  tab,
  onNavigate,
  onLogout,
}: {
  pathname: string
  tab: string
  onNavigate?: () => void
  onLogout: () => void
}) {
  const isActive = useStudentNavActive(pathname, tab)

  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition no-underline hover:no-underline min-h-[44px]',
                active
                  ? 'bg-white/15 font-medium text-white'
                  : 'hover:bg-white/10 text-white/90 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white hover:text-white hover:bg-white/10 min-h-[44px] text-sm"
          >
            <Home className="h-5 w-5 mr-2" />
            Public site
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 min-h-[44px] text-sm"
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

export function StudentPortalShell({
  userName,
  children,
}: {
  userName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'courses'
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="student-portal-sidebar text-on-dark hidden md:flex w-64 flex-col bg-[var(--brand-navy)] shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg text-white">{COMPANY.platformName}</p>
          <p className="text-xs text-white/75 mt-1">Student portal</p>
        </div>
        <StudentSidebarNav pathname={pathname} tab={tab} onLogout={handleLogout} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{COMPANY.platformName}</p>
            <p className="text-xs text-slate-600 truncate">{userName}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-slate-900 border-slate-300"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-[min(100%,280px)] p-0 bg-[var(--brand-navy)] border-none text-white">
            <SheetHeader className="p-5 border-b border-white/10 text-left">
              <SheetTitle className="text-white">{COMPANY.platformName}</SheetTitle>
              <p className="text-xs text-white/75">Student portal</p>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100%-5rem)]">
              <StudentSidebarNav
                pathname={pathname}
                tab={tab}
                onNavigate={() => setMenuOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </SheetContent>
        </Sheet>

        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Welcome back</p>
            <p className="font-semibold text-slate-900">{userName}</p>
          </div>
          <Link href="/student/courses">
            <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Browse programmes
            </Button>
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto app-form-surface">{children}</main>
      </div>
    </div>
  )
}
