'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BookOpen, Calculator, GraduationCap, Home, LogOut, Megaphone, User, Award, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const isActive = (item: (typeof nav)[0]) => {
    if (item.href.startsWith('/student/courses')) {
      return pathname.startsWith('/student/courses')
    }
    if (item.href === '/student/tools') {
      return pathname.startsWith('/student/tools')
    }
    if (item.href === '/student/certificates') {
      return pathname.startsWith('/student/certificates')
    }
    if (item.href === '/student/profile') {
      return pathname.startsWith('/student/profile')
    }
    if (item.tab && item.href.startsWith('/student/dashboard')) {
      if (pathname.startsWith('/student/courses/') && !pathname.endsWith('/enroll')) {
        return false
      }
      if (pathname.startsWith('/student/courses')) {
        return false
      }
      return pathname === '/student/dashboard' && tab === item.tab
    }
    if (item.href === '/student/dashboard') {
      return (
        (pathname === '/student/dashboard' && tab === 'courses') ||
        pathname.startsWith('/student/courses/') ||
        (pathname.startsWith('/student/courses') && pathname.includes('/enroll'))
      )
    }
    return pathname === item.href
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="student-portal-sidebar text-on-dark hidden md:flex w-64 flex-col bg-[var(--brand-navy)] shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg text-white">{COMPANY.platformName}</p>
          <p className="text-xs text-white/75 mt-1">Student portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition no-underline hover:no-underline',
                  active
                    ? 'bg-white/15 font-medium text-white'
                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link href="/" className="no-underline hover:no-underline">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Public site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-900 text-sm truncate">{COMPANY.platformName}</p>
          <div className="flex gap-1 shrink-0">
            <Link href="/student/tools">
              <Button size="sm" variant="outline" className="text-xs px-2 text-slate-900 border-slate-300">
                Tools
              </Button>
            </Link>
            <Link href="/student/profile">
              <Button size="sm" variant="outline" className="text-xs px-2 text-slate-900 border-slate-300">
                Profile
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button size="sm" variant="outline" className="text-xs px-2 text-slate-900 border-slate-300">
                Enroll
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="text-slate-900 border-slate-300" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
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
