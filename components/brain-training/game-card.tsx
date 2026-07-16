'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock3, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrainGameDef } from '@/lib/brain-training/catalog'
import { GameCoverArt } from '@/components/brain-training/game-cover-art'
import { normalizePublicMediaUrl } from '@/lib/media/safe-url'

type Props = {
  game: BrainGameDef
  href: string
  thumbnailUrl?: string | null
  className?: string
}

export function GameCard({ game, href, thumbnailUrl, className }: Props) {
  const cover = normalizePublicMediaUrl(thumbnailUrl)
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
      <div className="relative aspect-[16/10] overflow-hidden">
        <GameCoverArt art={game.art} patternId={patternId} className="absolute inset-0" />
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : null}
        {cover ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        ) : null}
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
