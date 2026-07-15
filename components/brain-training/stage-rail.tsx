'use client'

import { cn } from '@/lib/utils'

type Props = {
  total: number
  current: number
  className?: string
}

/** Compact L1–Ln progress chips during a drill. */
export function StageRail({ total, current, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] pb-0.5 -mx-0.5 px-0.5',
        className
      )}
      aria-label={`Stage ${current} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const stage = i + 1
        const done = stage < current
        const active = stage === current
        return (
          <span
            key={stage}
            className={cn(
              'inline-flex h-5 min-w-5 sm:h-6 sm:min-w-6 shrink-0 items-center justify-center rounded-md px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-bold',
              done && 'bg-emerald-100 text-emerald-800 border border-emerald-200',
              active && 'bg-[var(--brand-navy)] text-white border border-[var(--brand-navy)]',
              !done && !active && 'bg-slate-100 text-slate-500 border border-slate-200'
            )}
          >
            L{stage}
          </span>
        )
      })}
    </div>
  )
}
