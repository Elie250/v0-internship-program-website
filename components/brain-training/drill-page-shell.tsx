'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

type Props = {
  academyHref: string
  focusMode?: boolean
  children: React.ReactNode
}

/** Public drill chrome — collapses marketing chrome while a timed session runs. */
export function DrillPageShell({ academyHref, focusMode, children }: Props) {
  return (
    <main className={cn('min-h-screen bg-slate-50', focusMode && 'bg-white')}>
      {!focusMode ? <SiteHeader /> : null}
      {focusMode ? (
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
              Focus session
            </p>
            <p className="text-xs text-slate-500 hidden sm:block">Esc ends the drill</p>
            <Link
              href={academyHref}
              className="text-xs font-medium text-slate-600 hover:text-[var(--brand-navy)]"
            >
              Exit
            </Link>
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          'max-w-3xl mx-auto px-4 md:px-6',
          focusMode ? 'py-4 md:py-6' : 'py-8 md:py-12'
        )}
      >
        {!focusMode ? (
          <Link
            href={academyHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Brain Training Academy
          </Link>
        ) : null}
        {children}
      </div>
      {!focusMode ? <SiteFooter /> : null}
    </main>
  )
}
