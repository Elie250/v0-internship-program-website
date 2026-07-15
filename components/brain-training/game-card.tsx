'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock3, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrainGameDef } from '@/lib/brain-training/catalog'

type Props = {
  game: BrainGameDef
  href: string
  thumbnailUrl?: string | null
  className?: string
}

function ArtPattern({
  pattern,
  patternId,
}: {
  pattern: BrainGameDef['art']['pattern']
  patternId: string
}) {
  if (pattern === 'grid') {
    return (
      <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    )
  }
  if (pattern === 'waves') {
    return (
      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        <path
          d="M0 40 Q40 10 80 40 T160 40 T240 40 T320 40 V120 H0Z"
          fill="white"
          fillOpacity="0.15"
        />
        <path
          d="M0 70 Q40 40 80 70 T160 70 T240 70 T320 70"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    )
  }
  if (pattern === 'ladder') {
    return (
      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        {[28, 56, 84].map((y) => (
          <line key={y} x1="24" x2="220" y1={y} y2={y} stroke="white" strokeWidth="3" />
        ))}
        <line x1="40" x2="40" y1="20" y2="100" stroke="white" strokeWidth="3" />
        <line x1="200" x2="200" y1="20" y2="100" stroke="white" strokeWidth="3" />
      </svg>
    )
  }
  if (pattern === 'code') {
    return (
      <div
        className="absolute inset-0 p-4 font-mono text-[11px] leading-5 text-white/35 whitespace-pre"
        aria-hidden="true"
      >
        {`if (ready) {\n  scan();\n  latch();\n}`}
      </div>
    )
  }
  if (pattern === 'chips') {
    return (
      <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
        <rect
          x="40"
          y="30"
          width="70"
          height="50"
          rx="4"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        {[38, 48, 58, 68].map((y) => (
          <line key={y} x1="30" x2="40" y1={y} y2={y} stroke="white" strokeWidth="2" />
        ))}
      </svg>
    )
  }
  if (pattern === 'dots') {
    return (
      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <circle
            key={i}
            cx={20 + (i % 8) * 28}
            cy={24 + Math.floor(i / 8) * 28}
            r="3"
            fill="white"
          />
        ))}
      </svg>
    )
  }
  return (
    <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
      <circle cx="180" cy="40" r="28" fill="none" stroke="white" strokeWidth="6" />
      <circle cx="180" cy="40" r="8" fill="white" />
    </svg>
  )
}

function safeImageSrc(url?: string | null): string | null {
  if (!url) return null
  const t = url.trim()
  if (!/^https?:\/\//i.test(t)) return null
  return t
}

export function GameCard({ game, href, thumbnailUrl, className }: Props) {
  const cover = safeImageSrc(thumbnailUrl)
  const patternId = `brain-grid-${game.slug}`

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm',
        'transition duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--brand-navy)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]',
        className
      )}
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${game.art.from}, ${game.art.to})`,
        }}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <>
            <ArtPattern pattern={game.art.pattern} patternId={patternId} />
            <div
              className="absolute bottom-3 left-3 h-10 w-10 rounded-xl border border-white/40"
              style={{ backgroundColor: game.art.accent }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
          {game.categoryLabel}
        </span>
        <span className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-navy)] shadow-md transition group-hover:scale-110">
          <Play className="h-5 w-5 fill-current" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 bg-white">
        <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900">{game.name}</h3>
        <p className="text-sm text-slate-600 line-clamp-2">{game.shortTagline}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" /> ~{game.estimatedMinutes} min
          </span>
          <span>Lv 1–{game.maxLevel}</span>
        </div>
      </div>
    </Link>
  )
}
