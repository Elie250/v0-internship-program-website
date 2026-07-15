'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ShowcaseItem = {
  id: string
  title: string
  subtitle?: string
  href: string
  imageUrl?: string | null
  artFrom?: string
  artTo?: string
}

export type ShowcaseColumn = {
  id: string
  label: string
  browseHref: string
  browseLabel: string
  items: ShowcaseItem[]
}

const INTERVAL_MS = 4000

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

function RotatingWindow({ column, offsetMs }: { column: ShowcaseColumn; offsetMs: number }) {
  const reduced = usePrefersReducedMotion()
  const items = column.items
  const [index, setIndex] = useState(0)
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
        }, 280)
      }, INTERVAL_MS)
    }, offsetMs)

    return () => {
      window.clearTimeout(startId)
      if (intervalId != null) window.clearInterval(intervalId)
      if (fadeTimer != null) window.clearTimeout(fadeTimer)
    }
  }, [items.length, reduced, offsetMs])

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 h-full flex items-center justify-center min-h-[280px]">
        Coming soon
      </div>
    )
  }

  const item = items[index % items.length]!

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-navy)]">
          {column.label}
        </p>
        <span className="text-[11px] tabular-nums text-slate-500">
          {(index % items.length) + 1}/{items.length}
        </span>
      </div>

      <Link
        href={item.href}
        className="group relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-md min-h-[260px] sm:min-h-[300px] no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]"
      >
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300 ease-out',
            visible ? 'opacity-100' : 'opacity-0'
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(145deg, ${item.artFrom ?? '#0f2744'}, ${item.artTo ?? '#1d4ed8'})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="text-lg sm:text-xl font-bold leading-snug line-clamp-2 drop-shadow">
              {item.title}
            </p>
            {item.subtitle ? (
              <p className="mt-1 text-sm text-white/75 line-clamp-2">{item.subtitle}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <Link
        href={column.browseHref}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-navy)] hover:underline"
      >
        {column.browseLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

type Props = {
  columns: ShowcaseColumn[]
}

export function CatalogShowcaseRotator({ columns }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 md:gap-5">
      {columns.map((column, i) => (
        <RotatingWindow key={column.id} column={column} offsetMs={i * 1300} />
      ))}
    </div>
  )
}
