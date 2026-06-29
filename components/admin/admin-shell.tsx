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
import { ROLE_LABELS } from '@/types/platform'

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
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 rounded-md border bg-white overflow-hidden">
              <Image src={logoUrl} alt="Company logo" fill className="object-contain p-0.5" unoptimized />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="font-bold text-sm leading-tight truncate">Engineering Hub</p>
              <p className="text-xs text-muted-foreground">Admin Console</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {nav.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = ADMIN_NAV_ICONS[item.icon]
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link href={item.href}>
                            {Icon ? <Icon /> : null}
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

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/50 p-3 text-xs">
            <p className="font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-muted-foreground truncate">{user.email}</p>
            <p className="text-muted-foreground mt-1">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-1 items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700 hidden sm:block">
              Energy & Logics Platform Administration
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Public site
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut} className="text-slate-700">
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? '…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 app-form-surface">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
