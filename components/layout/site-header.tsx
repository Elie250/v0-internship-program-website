'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { COMPANY } from '@/lib/company/constants'

const learningLinks = [
  { href: '/learning', label: 'All courses & programmes' },
  { href: '/learning?module=training', label: 'Training' },
  { href: '/internship', label: 'Internship' },
  { href: '/engineering-support', label: 'Engineering Support' },
]

const careerLinks = [
  { href: '/career?module=guidance', label: 'Career Guidance' },
  { href: '/career?module=mentorship', label: 'Mentorship' },
  { href: '/career?module=workshops', label: 'Workshops' },
  { href: '/career?module=webinars', label: 'Webinars' },
  { href: '/career?module=events', label: 'Events' },
]

const topLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/engineering-support', label: 'Engineering Support' },
  { href: '/about', label: 'About' },
]

const navDropdownContentClass =
  'nav-dropdown-panel z-[100] min-w-[14rem] bg-white text-slate-900 border border-slate-200 shadow-xl'

const navDropdownItemClass =
  'cursor-pointer text-slate-800 focus:bg-slate-100 focus:text-slate-900'

const headerNavButtonClass =
  'text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/40'

function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">Menu</p>
        {topLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-900 hover:bg-slate-100 no-underline hover:no-underline"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">Learning</p>
        {learningLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2.5 text-base text-slate-800 hover:bg-slate-100 no-underline hover:no-underline"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">Career</p>
        {careerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2.5 text-base text-slate-800 hover:bg-slate-100 no-underline hover:no-underline"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="border-t pt-4 flex flex-col gap-2">
        <Link href="/auth/login" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button variant="outline" className="w-full border-slate-300 text-slate-900">
            Login
          </Button>
        </Link>
        <Link href="/auth/register" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
            Register
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function SiteHeader() {
  const [logoUrl, setLogoUrl] = useState(COMPANY.logoUrl)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/public/logo')
      .then((res) => res.json())
      .then((data) => {
        if (data.logoUrl) setLogoUrl(data.logoUrl)
      })
      .catch(() => {})
  }, [])

  return (
    <nav className="site-header text-on-dark sticky top-0 z-50 bg-[var(--brand-navy)] border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition no-underline hover:no-underline"
        >
          <div className="bg-white rounded-lg p-1 shrink-0">
            <Image
              src={logoUrl}
              alt={`${COMPANY.brandName} logo`}
              width={48}
              height={48}
              className="rounded object-contain h-9 w-9 sm:h-12 sm:w-auto sm:max-w-[120px]"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm sm:text-lg leading-tight text-white truncate">
              {COMPANY.brandName}
            </p>
            <p className="text-[10px] sm:text-[11px] text-white/75 truncate hidden sm:block">
              {COMPANY.slogan}
            </p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" className={headerNavButtonClass}>
              Home
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={headerNavButtonClass}>
                Learning <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={navDropdownContentClass}>
              {learningLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className={navDropdownItemClass}>
                  <Link
                    href={link.href}
                    className="w-full text-slate-800 no-underline hover:no-underline hover:text-[var(--brand-navy)]"
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/shop">
            <Button variant="ghost" className={headerNavButtonClass}>
              Shop
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={headerNavButtonClass}>
                Career <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={navDropdownContentClass}>
              {careerLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className={navDropdownItemClass}>
                  <Link
                    href={link.href}
                    className="w-full text-slate-800 no-underline hover:no-underline hover:text-[var(--brand-navy)]"
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/engineering-support">
            <Button variant="ghost" className={headerNavButtonClass}>
              Engineering Support
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className={headerNavButtonClass}>
              About
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex text-sm font-semibold text-white hover:text-white px-2 py-1.5 no-underline hover:underline"
          >
            Login
          </Link>
          <Link href="/auth/register" className="no-underline hover:no-underline">
            <Button
              size="sm"
              className="bg-white text-[var(--brand-navy)] hover:bg-white/90 font-semibold h-8 px-2.5 sm:px-3 text-xs sm:text-sm shadow-sm"
            >
              Register
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden h-9 w-9 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white shrink-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left text-[var(--brand-navy)]">{COMPANY.brandName}</SheetTitle>
              </SheetHeader>
              <MobileNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
