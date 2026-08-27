'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontLanguageToggle } from '@/components/storefront/storefront-language-toggle'
import { STOREFRONT_NAV_ITEMS } from '@/lib/shop/storefront-shops'
import { useShopCart } from '@/lib/shop/cart-context'

export function StorefrontHeader() {
  const t = useShopT()
  const { itemCount } = useShopCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--brand-navy,#1e3a5f)] text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
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
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-slate-200 px-4 py-4 text-left">
                <SheetTitle className="text-base text-[var(--brand-navy,#1e3a5f)]">
                  {t('brand.name')}
                </SheetTitle>
              </SheetHeader>
              <nav aria-label={t('storefront.a11y.nav')} className="grid gap-1 px-3 py-4">
                {STOREFRONT_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-4 border-t border-slate-200 px-4 py-4">
                <StorefrontLanguageToggle />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-slate-700"
                >
                  {t('storefront.staff')}: {t('action.signIn')}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/images/energy-logics-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-sm bg-white object-contain p-0.5"
          />
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {t('brand.name')}
          </span>
        </Link>

        <nav
          aria-label={t('storefront.a11y.nav')}
          className="ml-6 hidden items-center gap-6 lg:flex"
        >
          {STOREFRONT_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/85 transition-colors hover:text-white"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <StorefrontLanguageToggle inverted className="hidden sm:flex" />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/85 hover:text-white sm:inline"
          >
            {t('storefront.staff')}: {t('action.signIn')}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10"
            aria-label={t('storefront.a11y.cart')}
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[var(--brand-navy,#1e3a5f)]">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  )
}
