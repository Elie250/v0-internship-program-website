'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BookOpen, GraduationCap, Home, LogOut, Megaphone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/app/actions/auth-service'
import { useRouter } from 'next/navigation'
import { COMPANY } from '@/lib/company/constants'

const nav = [
  { href: '/student/dashboard', label: 'My learning', icon: GraduationCap },
  { href: '/student/dashboard?tab=webinars', label: 'Webinars', icon: Video },
  { href: '/student/dashboard?tab=announcements', label: 'Announcements', icon: Megaphone },
  { href: '/learning', label: 'Browse courses', icon: BookOpen, external: true },
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="text-on-dark hidden md:flex w-64 flex-col bg-[var(--brand-navy)] shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg">{COMPANY.platformName}</p>
          <p className="text-xs text-white/70 mt-1">Student portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const itemTab = item.href.includes('tab=')
              ? new URL(item.href, 'http://local').searchParams.get('tab')
              : null
            const active =
              pathname.startsWith('/student/courses') && item.href === '/student/dashboard'
                ? true
                : itemTab
                  ? pathname === '/student/dashboard' && tab === itemTab
                  : pathname === '/student/dashboard' && tab === 'courses' && item.href === '/student/dashboard'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition no-underline hover:no-underline',
                  active ? 'bg-white/15 font-medium text-white' : 'hover:bg-white/10 text-white/90'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/10">
              <Home className="h-4 w-4 mr-2" />
              Public site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/90 hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between gap-3 md:hidden">
          <p className="font-semibold text-[#1e3a5f]">My learning</p>
          <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
        </header>
        <header className="hidden md:flex bg-white border-b px-6 py-4 items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <p className="font-semibold text-[#1e3a5f]">{userName}</p>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
