'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BrainGamesArt, CalculatorsArt } from '@/components/tools/tools-center-art'

type Props = {
  calculatorsHref: string
  brainHref: string
  className?: string
  title?: string
  subtitle?: string
}

export function ToolsCenterHub({
  calculatorsHref,
  brainHref,
  className,
  title = 'Tools Center',
  subtitle = 'Professional engineering calculators and cognitive drills — built for training, labs, and field work.',
}: Props) {
  return (
    <div className={cn('space-y-10', className)}>
      <header className="space-y-3 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-navy)]">
          Energy &amp; Logics · Engineering Hub
        </p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">{subtitle}</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-7">
        <ToolShowcase
          href={calculatorsHref}
          eyebrow="Field & classroom"
          title="Engineering Calculators"
          description="Folders for power, wiring, electronics, and energy — wire sizing, voltage drop, Ohm’s law, solar, and more."
          cta="Open calculators"
          art={<CalculatorsArt className="h-full w-full object-cover" />}
          points={['Wire sizing & voltage drop', 'Power & PF tools', 'Electronics helpers']}
        />

        <ToolShowcase
          href={brainHref}
          eyebrow="Arcade"
          title="Brain Training Games"
          description="Attention, memory, and engineering YES/NO drills with stages, clear symbols, and pass/retry gates."
          cta="Enter Academy"
          art={<BrainGamesArt className="h-full w-full object-cover" />}
          points={['Color-Word & Sequence', 'Logic & circuit quizzes', '10-stage progression']}
          accent
        />
      </div>
    </div>
  )
}

function ToolShowcase({
  href,
  eyebrow,
  title,
  description,
  cta,
  art,
  points,
  accent,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
  cta: string
  art: ReactNode
  points: string[]
  accent?: boolean
}) {
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg',
        accent && 'ring-1 ring-[var(--brand-navy)]/10'
      )}
    >
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2 rounded-3xl">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
            {art}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
            {eyebrow}
          </span>
        </div>
      </Link>

      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{description}</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {points.map((p) => (
            <li
              key={p}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {p}
            </li>
          ))}
        </ul>
        <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 h-11 rounded-xl">
          <Link href={href}>
            {cta}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
