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

const navDropdownContentClass =
  'nav-dropdown-panel z-[100] min-w-[14rem] bg-white text-slate-900 border border-slate-200 shadow-xl'

const navDropdownItemClass =
  'cursor-pointer text-slate-800 focus:bg-slate-100 focus:text-slate-900'

const headerNavButtonClass =
  'text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/40 h-9 px-2.5 text-sm'

const mobileNavLinkClass =
  'block rounded-lg px-3 py-2.5 text-base font-medium text-slate-950 hover:bg-slate-100 no-underline hover:no-underline'

const mobileRegisterButtonClass =
  'site-header-register-btn h-8 px-2.5 text-xs font-semibold bg-white text-[var(--brand-navy)] hover:bg-slate-100 shadow-sm border border-white'

function BrandMark({
  logoUrl,
  compact = false,
}: {
  logoUrl: string
  compact?: boolean
}) {
  return (
    <div className="bg-white rounded-md p-0.5 shrink-0 shadow-sm border border-white/80">
      <Image
        src={logoUrl}
        alt={`${COMPANY.brandName} logo`}
        width={48}
        height={48}
        className={
          compact
            ? 'rounded object-contain h-8 w-8'
            : 'rounded object-contain h-9 w-9 xl:h-10 xl:w-auto xl:max-w-[100px]'
        }
        unoptimized
      />
    </div>
  )
}

function MobileNavSheet({
  logoUrl,
  open,
  onOpenChange,
}: {
  logoUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="site-header-menu-btn h-9 w-9 rounded-lg bg-white text-[var(--brand-navy)] hover:bg-slate-100 hover:text-[var(--brand-navy)] shadow-sm border border-white/90 shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="mobile-nav-sheet w-[min(100vw-1.5rem,22rem)] overflow-y-auto bg-white p-0 [&>[data-slot=sheet-close]]:top-4 [&>[data-slot=sheet-close]]:right-4 [&>[data-slot=sheet-close]]:text-slate-700 [&>[data-slot=sheet-close]]:opacity-100 [&>[data-slot=sheet-close]]:hover:bg-slate-100 [&>[data-slot=sheet-close]]:rounded-md"
      >
        <SheetHeader className="border-b border-slate-200 bg-slate-50 px-4 py-4 pr-12">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 no-underline hover:no-underline"
          >
            <BrandMark logoUrl={logoUrl} compact />
            <SheetTitle className="text-base font-bold text-[var(--brand-navy)] truncate">
              {COMPANY.brandName}
            </SheetTitle>
          </Link>
        </SheetHeader>
        <div className="px-4 pb-6">
          <MobileNav onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
  const topLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/engineering-support', label: 'Engineering Support' },
    { href: '/about', label: 'About' },
    { href: '/reviews', label: 'Reviews' },
  ]

  return (
    <div className="mobile-nav-panel flex flex-col gap-6 py-2">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-1">Menu</p>
        {topLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className={mobileNavLinkClass}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-1">Learning</p>
        {learningLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className={mobileNavLinkClass}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-1">Career</p>
        {careerLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className={mobileNavLinkClass}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
        <Link href="/auth/login" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button variant="outline" className="w-full border-slate-400 bg-white text-slate-950 font-semibold hover:bg-slate-50">
            Login
          </Button>
        </Link>
        <Link href="/auth/register" onClick={onNavigate} className="no-underline hover:no-underline">
          <Button className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 font-semibold">
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
      {/* Desktop */}
      <div className="hidden lg:flex max-w-7xl mx-auto justify-between items-center gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition no-underline hover:no-underline shrink-0"
        >
          <BrandMark logoUrl={logoUrl} />
          <div className="min-w-0 hidden xl:block">
            <p className="font-bold text-base leading-tight text-white truncate">{COMPANY.brandName}</p>
            <p className="text-[10px] text-white/80 truncate leading-snug max-w-[12rem]">{COMPANY.slogan}</p>
          </div>
        </Link>

        <div className="flex items-center gap-0.5 flex-1 justify-center min-w-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className={headerNavButtonClass}>
              Home
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={headerNavButtonClass}>
                Learning <ChevronDown className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={navDropdownContentClass}>
              {learningLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className={navDropdownItemClass}>
                  <Link href={link.href} className="w-full text-slate-800 no-underline hover:no-underline hover:text-[var(--brand-navy)]">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/shop">
            <Button variant="ghost" size="sm" className={headerNavButtonClass}>
              Shop
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={headerNavButtonClass}>
                Career <ChevronDown className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={navDropdownContentClass}>
              {careerLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className={navDropdownItemClass}>
                  <Link href={link.href} className="w-full text-slate-800 no-underline hover:no-underline hover:text-[var(--brand-navy)]">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/about">
            <Button variant="ghost" size="sm" className={headerNavButtonClass}>
              About
            </Button>
          </Link>
          <Link href="/reviews">
            <Button variant="ghost" size="sm" className={headerNavButtonClass}>
              Reviews
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/auth/login" className="text-sm font-semibold text-white hover:text-white px-2 py-1 no-underline hover:underline whitespace-nowrap">
            Login
          </Link>
          <Link href="/auth/register" className="no-underline hover:no-underline">
            <Button size="sm" className="site-header-register-btn bg-white text-[var(--brand-navy)] hover:bg-slate-100 font-semibold h-8 px-3 shadow-sm border border-white">
              Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile: menu + logo left, auth right — no center brand block */}
      <div className="lg:hidden flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <MobileNavSheet logoUrl={logoUrl} open={mobileOpen} onOpenChange={setMobileOpen} />
          <Link href="/" className="hover:opacity-90 transition no-underline hover:no-underline shrink-0" aria-label={`${COMPANY.brandName} home`}>
            <BrandMark logoUrl={logoUrl} compact />
          </Link>
        </div>

        <div className="site-header-mobile-auth flex items-center gap-1.5 shrink-0">
          <Link href="/auth/login" className="inline-flex items-center h-8 px-1.5 text-xs font-semibold text-white hover:text-white no-underline hover:underline whitespace-nowrap">
            Login
          </Link>
          <Link href="/auth/register" className="no-underline hover:no-underline">
            <Button size="sm" className={mobileRegisterButtonClass}>
              Register
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
