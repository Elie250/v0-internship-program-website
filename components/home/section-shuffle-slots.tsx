'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ShuffleCardItem = {
  id: string
  title: string
  subtitle?: string
  href: string
  imageUrl?: string | null
  badge?: string
  artFrom?: string
  artTo?: string
  ctaLabel?: string
}

type Props = {
  items: ShuffleCardItem[]
  slots?: number
  intervalMs?: number
  emptyLabel?: string
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

function ShuffleSlot({
  items,
  startOffset,
  intervalMs,
  staggerMs,
}: {
  items: ShuffleCardItem[]
  startOffset: number
  intervalMs: number
  staggerMs: number
}) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(startOffset % Math.max(items.length, 1))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (reduced || items.length <= 1) return
    let intervalId: number | null = null
    let fadeTimer: number | null = null
    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisible(false)
        fadeTimer = window.setTimeout(() => {
          setIndex((i) => (i + 1) % items.length)
          setVisible(true)
        }, 250)
      }, intervalMs)
    }, staggerMs)
    return () => {
      window.clearTimeout(startId)
      if (intervalId != null) window.clearInterval(intervalId)
      if (fadeTimer != null) window.clearTimeout(fadeTimer)
    }
  }, [items.length, reduced, intervalMs, staggerMs])

  if (items.length === 0) return null
  const item = items[index % items.length]!

  return (
    <Link
      href={item.href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm min-h-[220px] no-underline hover:no-underline hover:border-[var(--brand-navy)]/35 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]"
    >
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            visible ? 'opacity-100' : 'opacity-0'
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(145deg, ${item.artFrom ?? '#1e3a5f'}, ${item.artTo ?? '#2563eb'})`,
              }}
            />
          )}
        </div>
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col gap-1.5 p-3.5 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {item.badge ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-navy)]">
            {item.badge}
          </span>
        ) : null}
        <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.title}</p>
        {item.subtitle ? (
          <p className="text-xs text-slate-600 line-clamp-2 flex-1">{item.subtitle}</p>
        ) : null}
        {item.ctaLabel ? (
          <p className="text-xs font-semibold text-[var(--brand-navy)] mt-auto pt-1">{item.ctaLabel}</p>
        ) : null}
      </div>
    </Link>
  )
}

/** Fixed N windows that cycle through a shared catalogue (no duplicate homepage section). */
export function SectionShuffleSlots({
  items,
  slots = 3,
  intervalMs = 4200,
  emptyLabel = 'Nothing to show yet.',
  className,
}: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600 text-center py-8">{emptyLabel}</p>
  }

  const count = Math.min(slots, Math.max(items.length, 1))

  return (
    <div className={cn('grid sm:grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, slot) => (
        <ShuffleSlot
          key={slot}
          items={items}
          startOffset={slot % items.length}
          intervalMs={intervalMs}
          staggerMs={slot * 1200}
        />
      ))}
    </div>
  )
}
