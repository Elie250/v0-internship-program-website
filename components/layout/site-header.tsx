'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const learningLinks = [
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

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-[#1e3a5f] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="bg-white/10 rounded-lg p-1.5">
            <Image src="/logo.png" alt="Engineering Hub" width={36} height={36} className="rounded" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">Engineering Hub</p>
            <p className="text-[11px] text-white/70">Energy & Logics</p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">Home</Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Learning <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {learningLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/shop">
            <Button variant="ghost" className="text-white hover:bg-white/10">Shop</Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Career <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {careerLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/engineering-support">
            <Button variant="ghost" className="text-white hover:bg-white/10">Engineering Support</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className="text-white hover:bg-white/10">About</Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="text-white hover:bg-white/10">Contact</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-sm font-medium hover:underline">
            Login
          </Link>
          <Link href="/auth/register" className="hidden sm:block">
            <Button size="sm" className="bg-white text-[#1e3a5f] hover:bg-white/90">Register</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
