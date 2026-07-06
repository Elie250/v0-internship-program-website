'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Home, LogOut } from 'lucide-react'
import { logoutUser } from '@/app/actions/auth-service'
import type { AdminSession } from '@/app/actions/admin-context'
import { ADMIN_NAV_ICONS } from '@/components/admin/admin-nav-icons'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'
import {
  filterMobileHubs,
  findNavGroupForSection,
  findNavItem,
  resolveSectionFromPathname,
} from '@/lib/admin/nav'
import { ROLE_LABELS } from '@/types/platform'
import { COMPANY } from '@/lib/company/constants'

export function AdminShell({
  session,
  logoUrl,
  children,
}: {
  session: AdminSession
  logoUrl: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, nav } = session
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const sectionId = resolveSectionFromPathname(pathname)
  const currentItem = sectionId ? findNavItem(sectionId) : undefined
  const currentGroup = sectionId ? findNavGroupForSection(sectionId) : undefined
  const mobileHubs = filterMobileHubs(user.permissions)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      await logoutUser()
    } catch {
      // Still redirect — GET logout clears cookies as fallback
    } finally {
      window.location.href = '/auth/login?logout=1'
    }
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="admin-portal-sidebar border-r-0">
        <SidebarHeader className="border-b border-white/15 p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 rounded-md border border-white/25 bg-white overflow-hidden">
              <Image src={logoUrl} alt="Company logo" fill className="object-contain p-0.5" unoptimized />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-bold text-sm leading-tight truncate text-white">{COMPANY.platformName}</p>
              <p className="text-xs text-white/80">Administration</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          {nav.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel className="text-white/70 uppercase text-[10px] tracking-wider font-semibold px-2">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = ADMIN_NAV_ICONS[item.icon]
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className={
                            isActive
                              ? 'bg-white text-[var(--brand-navy)] font-semibold hover:bg-white hover:text-[var(--brand-navy)]'
                              : 'text-white/90 hover:bg-white/12 hover:text-white'
                          }
                        >
                          <Link href={item.href}>
                            {Icon ? <Icon className={isActive ? 'text-[var(--brand-navy)]' : undefined} /> : null}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/15 p-3">
          <div className="rounded-lg bg-white/12 p-3 text-xs group-data-[collapsible=icon]:hidden">
            <p className="font-semibold truncate text-white">{userName}</p>
            <p className="text-white/80 truncate">{user.email}</p>
            <p className="text-white/65 mt-1">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <Link href="/" className="mt-2 block group-data-[collapsible=icon]:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/90 hover:text-white hover:bg-white/12"
            >
              <Home className="h-4 w-4 mr-2" />
              Public site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-white/90 hover:text-white hover:bg-white/12"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-slate-100/80 admin-portal-main">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 backdrop-blur px-4 shadow-sm">
          <SidebarTrigger className="text-slate-900 shrink-0" aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              {currentGroup ? (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {currentGroup.label}
                </p>
              ) : (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Administration
                </p>
              )}
              <p className="text-sm font-semibold text-slate-900 truncate">
                {currentItem?.label ?? 'Dashboard overview'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:inline-flex text-slate-900 border-slate-300 bg-white hover:bg-slate-50"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Public site
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6 app-form-surface admin-portal-content">
          {children}
        </div>
        <AdminMobileNav hubs={mobileHubs} />
      </SidebarInset>
    </SidebarProvider>
  )
}
