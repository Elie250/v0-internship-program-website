import { SHOP_PORTAL_DISPLAY, type ShopNavItem } from '@/lib/shop/portal-nav'
import { ShopNav } from '@/components/shop-portal/shop-nav'
import { ShopLogoutButton } from '@/components/shop-portal/shop-logout-button'
import { ShopHeader } from '@/components/shop-portal/shop-header'

export function ShopShell({
  items,
  userLabel,
  roleLabel,
  children,
}: {
  items: ShopNavItem[]
  userLabel: string
  roleLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Energy &amp; Logics
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--brand-navy,#1e3a5f)]">
              {SHOP_PORTAL_DISPLAY.brandName}
            </p>
            <p className="text-xs text-slate-500">{SHOP_PORTAL_DISPLAY.siteLabel}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ShopNav items={items} />
          </div>
          <div className="border-t border-slate-200 px-4 py-4 space-y-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{userLabel}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
            <ShopLogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <ShopHeader items={items} userLabel={userLabel} roleLabel={roleLabel} />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
