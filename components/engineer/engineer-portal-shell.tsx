'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Bot,
  Calculator,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Rss,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/app/actions/auth-service'
import { useRouter } from 'next/navigation'
import { COMPANY } from '@/lib/company/constants'
import type { SupportAccessSummary } from '@/lib/support/types'

const nav = [
  { href: '/engineer/dashboard', label: 'Overview', icon: LayoutDashboard, match: 'dashboard' as const },
  { href: '/engineer/community', label: 'Community', icon: Users, match: 'community' as const },
  { href: '/engineer/ai', label: 'AI assistant', icon: Bot, match: 'ai' as const },
  { href: '/engineer/support', label: 'Support', icon: Headphones, match: 'support' as const },
  { href: '/engineer/field-notes', label: 'Field Notes', icon: PenLine, match: 'field-notes' as const },
  { href: '/engineer/posts', label: 'Public posts', icon: Rss, match: 'posts' as const },
  { href: '/engineer/tools', label: 'Tools', icon: Calculator, match: 'tools' as const },
  { href: '/engineer/profile', label: 'Profile', icon: User, match: 'profile' as const },
]

function useNavActive(pathname: string) {
  return (item: (typeof nav)[0]) => {
    if (item.match === 'dashboard') return pathname === '/engineer/dashboard'
    return pathname.startsWith(`/engineer/${item.match}`)
  }
}

function EngineerSidebarContent({
  pathname,
  photoUrl,
  onNavigate,
  onLogout,
}: {
  pathname: string
  photoUrl?: string | null
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
        <Link href="/subscriber" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 min-h-[44px] text-sm"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Subscriber hub
          </Button>
        </Link>
        <Link href="/engineering" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 min-h-[44px] text-sm"
          >
            <PenLine className="h-5 w-5 mr-2" />
            Browse Field Notes
          </Button>
        </Link>
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
        {photoUrl ? (
          <div className="pt-2 flex justify-center md:hidden">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/20">
              <Image src={photoUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

export function EngineerPortalShell({
  userName,
  photoUrl,
  supportAccess,
  children,
  title,
  description,
  headerAction,
}: {
  userName: string
  photoUrl?: string | null
  supportAccess?: SupportAccessSummary | null
  children: React.ReactNode
  title?: string
  description?: string
  headerAction?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const closeMobile = () => setMobileOpen(false)
  const planLabel = supportAccess?.hasActiveSubscription
    ? supportAccess.planTier === 'paid'
      ? 'Paid member'
      : 'Free member'
    : null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 flex-col bg-[var(--brand-navy)] text-white shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg text-white">{COMPANY.platformName}</p>
          <p className="text-xs text-white/75 mt-1">Engineer portal</p>
        </div>
        <EngineerSidebarContent
          pathname={pathname}
          photoUrl={photoUrl}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5">
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
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 leading-tight">Engineer portal</p>
              <p className="font-semibold text-slate-900 text-sm truncate">{userName}</p>
            </div>
            {planLabel ? (
              <Badge className="shrink-0 bg-white/90 text-[var(--brand-navy)] border-slate-200">
                {planLabel}
              </Badge>
            ) : null}
          </div>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-[min(100vw-2rem,20rem)] p-0 border-0 bg-[var(--brand-navy)] text-white [&>[data-slot=sheet-close]]:text-white [&>[data-slot=sheet-close]]:opacity-90 [&>[data-slot=sheet-close]]:hover:bg-white/10 [&>[data-slot=sheet-close]]:top-4 [&>[data-slot=sheet-close]]:right-4"
          >
            <SheetHeader className="border-b border-white/10 px-4 py-4 pr-12 text-left">
              <SheetTitle className="text-white text-left">
                <span className="block font-bold text-lg">{COMPANY.platformName}</span>
                <span className="block text-xs font-normal text-white/75 mt-0.5">Engineer portal</span>
              </SheetTitle>
              <p className="text-sm text-white/80 truncate pt-1">{userName}</p>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100%-5.5rem)] overflow-y-auto">
              <EngineerSidebarContent
                pathname={pathname}
                photoUrl={photoUrl}
                onNavigate={closeMobile}
                onLogout={handleLogout}
              />
            </div>
          </SheetContent>
        </Sheet>

        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {photoUrl ? (
              <div className="relative h-11 w-11 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <Image src={photoUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <>
                  <p className="text-sm text-slate-600">{description ?? 'Engineer portal'}</p>
                  <h1 className="font-semibold text-slate-900 truncate">{title}</h1>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Welcome back</p>
                  <p className="font-semibold text-slate-900 truncate">{userName}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {planLabel ? (
              <Badge
                className={
                  supportAccess?.planTier === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-700'
                }
              >
                {planLabel}
              </Badge>
            ) : null}
            {headerAction}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto app-form-surface">
          {(title || description) && (
            <div className="md:hidden mb-4">
              {description ? <p className="text-sm text-slate-600">{description}</p> : null}
              {title ? <h1 className="text-xl font-bold text-slate-900">{title}</h1> : null}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
