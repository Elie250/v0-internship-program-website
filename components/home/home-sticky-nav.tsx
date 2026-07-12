'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#programmes', label: 'Programmes' },
  { href: '#read-explore', label: 'Library' },
  { href: '#tools', label: 'Tools' },
  { href: '#reviews', label: 'Reviews' },
] as const

export function HomeStickyNav() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.55)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      aria-label="Homepage sections"
      className={cn(
        'fixed top-[var(--site-header-h)] left-0 right-0 z-40 hidden lg:block transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-1 py-2">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="home-anchor-link rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 hover:text-[var(--brand-navy)] hover:bg-slate-100"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
