'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ClipboardList, LogIn, Menu, Package, ShoppingBag, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontLanguageToggle } from '@/components/storefront/storefront-language-toggle'
import { StorefrontHeaderSearch } from '@/components/storefront/storefront-header-search'
import { StorefrontShopContext } from '@/components/storefront/storefront-shop-context'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import type { StorefrontShopOption } from '@/lib/shop/storefront-shops'
import { useShopCart } from '@/lib/shop/cart-context'
import { cn } from '@/lib/utils'

const MOBILE_NAV_LINK =
  'flex min-h-11 min-w-0 items-center gap-2 overflow-hidden rounded-md px-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy,#1e3a5f)] focus-visible:ring-offset-2'

export function StorefrontHeader({
  shops,
  currentShopCode,
}: {
  shops: readonly StorefrontShopOption[]
  currentShopCode: string
}) {
  const t = useShopT()
  const { itemCount } = useShopCart()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const mobileNavClass = (href: string) =>
    cn(MOBILE_NAV_LINK, pathname === href && 'bg-slate-100 text-[var(--brand-navy,#1e3a5f)]')

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--brand-navy,#1e3a5f)] text-white">
      <div className={STOREFRONT_GUTTER}>
        <div className="flex items-center gap-2 py-2 lg:h-16 lg:gap-3 lg:py-0">
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white"
                  aria-label={t('a11y.openMenu')}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex h-full w-full max-w-xs flex-col gap-0 overflow-x-hidden bg-white p-0 text-slate-900 shadow-none [&>button]:text-slate-800 [&>button]:opacity-100 [&>button]:hover:bg-slate-100 [&>button]:hover:opacity-100 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-[var(--brand-navy,#1e3a5f)]"
              >
                <SheetHeader className="border-b border-slate-200 bg-white px-4 py-4 pr-12 text-left">
                  <SheetTitle className="text-base font-semibold text-[var(--brand-navy,#1e3a5f)]">
                    {t('brand.name')}
                  </SheetTitle>
                </SheetHeader>
                <nav
                  aria-label={t('storefront.a11y.nav')}
                  className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3"
                >
                  <div className="px-3 py-2 text-slate-800">
                    <StorefrontShopContext shops={shops} currentCode={currentShopCode} />
                  </div>
                  <div className="grid gap-1">
                    <Link href="/" onClick={() => setOpen(false)} className={mobileNavClass('/')}>
                      <Package className="h-4 w-4 shrink-0 text-[var(--brand-navy,#1e3a5f)]" aria-hidden />
                      <span className="min-w-0 break-words">{t('storefront.nav.products')}</span>
                    </Link>
                    <Link
                      href="/track"
                      onClick={() => setOpen(false)}
                      className={mobileNavClass('/track')}
                    >
                      <ClipboardList className="h-4 w-4 shrink-0 text-[var(--brand-navy,#1e3a5f)]" aria-hidden />
                      <span className="min-w-0 break-words">{t('storefront.nav.track')}</span>
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      className={mobileNavClass('/cart')}
                    >
                      <ShoppingBag className="h-4 w-4 shrink-0 text-[var(--brand-navy,#1e3a5f)]" aria-hidden />
                      <span className="min-w-0 break-words">
                        {t('storefront.header.cart', { n: itemCount })}
                      </span>
                    </Link>
                    <p className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-800">
                      <Smartphone className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                      <span className="min-w-0 break-words">
                        {t('storefront.header.download')}
                        <span className="ml-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {t('storefront.header.downloadSoon')}
                        </span>
                      </span>
                    </p>
                  </div>
                </nav>
                <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-4">
                  <StorefrontLanguageToggle emphasis />
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={cn(MOBILE_NAV_LINK, 'font-medium text-slate-800')}
                  >
                    <LogIn className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                    <span className="min-w-0 break-words">{t('storefront.footer.manage')}</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
            <Image
              src="/images/energy-logics-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-sm bg-white object-contain p-0.5"
            />
            <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline">
              {t('brand.short')}
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 md:block">
            <StorefrontHeaderSearch />
          </div>

          <StorefrontShopContext
            shops={shops}
            currentCode={currentShopCode}
            tone="header"
            className="hidden md:inline-flex"
          />

          <Link
            href="/track"
            className="hidden shrink-0 text-sm font-medium text-white/90 hover:text-white md:inline"
          >
            {t('storefront.nav.track')}
          </Link>

          <span
            className="hidden shrink-0 items-center gap-1 text-xs text-white/55 xl:inline-flex"
            title={t('storefront.header.downloadSoon')}
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            {t('storefront.header.download')}
            <span className="text-[10px] uppercase tracking-wide">
              {t('storefront.header.downloadSoon')}
            </span>
          </span>

          <StorefrontLanguageToggle inverted compact className="hidden md:flex" />

          <Link
            href="/login"
            className="hidden shrink-0 text-xs text-white/55 hover:text-white/80 xl:inline"
          >
            {t('storefront.footer.manage')}
          </Link>

          <Link
            href="/cart"
            className="relative ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-white hover:bg-white/10 md:ml-0"
            aria-label={t('storefront.header.cart', { n: itemCount })}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden text-sm font-medium sm:inline">
              {t('storefront.header.cart', { n: itemCount })}
            </span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[var(--brand-navy,#1e3a5f)] sm:hidden">
              {itemCount}
            </span>
          </Link>
        </div>

        <div className="pb-2 md:hidden">
          <StorefrontHeaderSearch />
        </div>
      </div>
    </header>
  )
}
