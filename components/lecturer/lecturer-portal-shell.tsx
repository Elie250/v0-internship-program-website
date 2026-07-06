'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Calculator,
  GraduationCap,
  Home,
  LogOut,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/app/actions/auth-service'
import { useRouter } from 'next/navigation'
import { COMPANY } from '@/lib/company/constants'

const nav = [
  { href: '/lecturer/dashboard', label: 'My programmes', icon: GraduationCap, match: 'programmes' as const },
  { href: '/lecturer/students', label: 'Students', icon: Users, match: 'students' as const },
  { href: '/lecturer/tools', label: 'Tools', icon: Calculator, match: 'tools' as const },
  { href: '/lecturer/profile', label: 'Profile', icon: User, match: 'profile' as const },
]

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

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const isActive = (item: (typeof nav)[0]) => {
    if (item.match === 'programmes') {
      return pathname === '/lecturer/dashboard' || pathname.startsWith('/lecturer/courses/')
    }
    if (item.match === 'students') return pathname.startsWith('/lecturer/students')
    if (item.match === 'tools') return pathname.startsWith('/lecturer/tools')
    if (item.match === 'profile') return pathname.startsWith('/lecturer/profile')
    return pathname === item.href
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="lecturer-portal-sidebar text-on-dark hidden md:flex w-64 flex-col bg-[var(--brand-navy)] shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg text-white">{COMPANY.platformName}</p>
          <p className="text-xs text-white/75 mt-1">Lecturer portal</p>
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
          <Link href="/engineering-support" className="no-underline hover:no-underline">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Engineering support
            </Button>
          </Link>
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
            <Link href="/lecturer/tools">
              <Button size="sm" variant="outline" className="text-xs px-2 text-slate-900 border-slate-300">
                Tools
              </Button>
            </Link>
            <Link href="/lecturer/profile">
              <Button size="sm" variant="outline" className="text-xs px-2 text-slate-900 border-slate-300">
                Profile
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
