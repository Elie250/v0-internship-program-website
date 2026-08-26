'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShopNav } from '@/components/shop-portal/shop-nav'
import { ShopLogoutButton } from '@/components/shop-portal/shop-logout-button'
import { SHOP_PORTAL_DISPLAY, type ShopNavItem } from '@/lib/shop/portal-nav'

export function ShopHeader({
  items,
  userLabel,
  roleLabel,
}: {
  items: ShopNavItem[]
  userLabel: string
  roleLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-slate-200 px-4 py-4 text-left">
                <SheetTitle className="text-base text-[var(--brand-navy,#1e3a5f)]">
                  {SHOP_PORTAL_DISPLAY.brandName}
                </SheetTitle>
                <p className="text-xs text-slate-500">{SHOP_PORTAL_DISPLAY.siteLabel}</p>
              </SheetHeader>
              <div className="px-3 py-4">
                <ShopNav items={items} onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-auto border-t border-slate-200 px-4 py-4">
                <ShopLogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--brand-navy,#1e3a5f)]">
            {SHOP_PORTAL_DISPLAY.brandName}
          </p>
          <p className="truncate text-xs text-slate-500">{SHOP_PORTAL_DISPLAY.siteLabel}</p>
        </div>

        <div className="hidden sm:block text-right min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{userLabel}</p>
          <p className="truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
        <div className="hidden sm:block">
          <ShopLogoutButton />
        </div>
      </div>
    </header>
  )
}
