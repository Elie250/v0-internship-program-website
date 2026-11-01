'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { GameCoverArt } from '@/components/brain-training/game-cover-art'
import type { GameArtTheme } from '@/lib/brain-training/catalog'

export type ShuffleCardItem = {
  id: string
  title: string
  subtitle?: string
  href: string
  imageUrl?: string | null
  badge?: string
  artFrom?: string
  artTo?: string
  /** Full Arcade cover art when no uploaded thumbnail */
  art?: Pick<GameArtTheme, 'from' | 'to' | 'accent' | 'pattern'>
  ctaLabel?: string
}

type Props = {
  items: ShuffleCardItem[]
  slots?: number
  intervalMs?: number
  emptyLabel?: string
  className?: string
}

const FADE_MS = 300

export function visibleSlotItemIndex(baseIndex: number, slotIndex: number, itemCount: number): number {
  if (itemCount <= 0) return 0
  return (((baseIndex % itemCount) + slotIndex) % itemCount + itemCount) % itemCount
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

function SlotFace({ item }: { item: ShuffleCardItem }) {
  return (
    <>
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {item.art ? (
          <GameCoverArt
            art={item.art}
            patternId={`home-game-${item.id}`}
            className="absolute inset-0"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, ${item.artFrom ?? '#1e3a5f'}, ${item.artTo ?? '#2563eb'})`,
            }}
          />
        )}
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
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
    </>
  )
}

function ShuffleSlot({
  item,
  reducedMotion,
}: {
  item: ShuffleCardItem
  reducedMotion: boolean
}) {
  const [shown, setShown] = useState(item)
  const [incoming, setIncoming] = useState<ShuffleCardItem | null>(null)
  const [incomingVisible, setIncomingVisible] = useState(false)

  useEffect(() => {
    if (item.id === shown.id) {
      setShown(item)
      return
    }

    if (reducedMotion) {
      setShown(item)
      setIncoming(null)
      setIncomingVisible(false)
      return
    }

    setIncoming(item)
    setIncomingVisible(false)
    const frame = window.requestAnimationFrame(() => {
      setIncomingVisible(true)
    })
    const done = window.setTimeout(() => {
      setShown(item)
      setIncoming(null)
      setIncomingVisible(false)
    }, FADE_MS)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
  }, [item, reducedMotion, shown.id])

  const href = incoming?.href ?? shown.href

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm min-h-[220px] no-underline hover:no-underline hover:border-[var(--brand-navy)]/35 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]"
    >
      <div className="relative flex flex-1 flex-col">
        <SlotFace item={shown} />
        {incoming ? (
          <div
            className={cn(
              'absolute inset-0 flex flex-col bg-white transition-opacity duration-300',
              incomingVisible ? 'opacity-100' : 'opacity-0'
            )}
          >
            <SlotFace item={incoming} />
          </div>
        ) : null}
      </div>
    </Link>
  )
}

/** Fixed N windows that cycle a shared catalogue from one clock. Slots stay unique. */
export function SectionShuffleSlots({
  items,
  slots = 3,
  intervalMs = 4200,
  emptyLabel = 'Nothing to show yet.',
  className,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const itemCount = items.length
  const count = Math.min(slots, Math.max(itemCount, 1))
  const [baseIndex, setBaseIndex] = useState(0)

  useEffect(() => {
    setBaseIndex(0)
  }, [itemCount])

  useEffect(() => {
    if (reduced || itemCount <= 1) return

    const intervalId = window.setInterval(() => {
      setBaseIndex((current) => (current + 1) % itemCount)
    }, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [reduced, itemCount, intervalMs])

  if (itemCount === 0) {
    return <p className="text-sm text-slate-600 text-center py-8">{emptyLabel}</p>
  }

  return (
    <div className={cn('grid sm:grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }, (_, slotIndex) => {
        const item = items[visibleSlotItemIndex(baseIndex, slotIndex, itemCount)]!
        return <ShuffleSlot key={slotIndex} item={item} reducedMotion={reduced} />
      })}
    </div>
  )
}
