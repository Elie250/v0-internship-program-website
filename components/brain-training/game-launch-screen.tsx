'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Clock3, Play, Zap } from 'lucide-react'
import type { BrainGameDef } from '@/lib/brain-training/catalog'
import { cn } from '@/lib/utils'

type Props = {
  game: BrainGameDef
  thumbnailUrl?: string | null
  onPlay: () => void
  onWarmup?: () => void
  onBack: () => void
  className?: string
}

/** Shared title-screen for every drill — arcade cover, not a documentation card. */
export function GameLaunchScreen({
  game,
  thumbnailUrl,
  onPlay,
  onWarmup,
  onBack,
  className,
}: Props) {
  const cover =
    typeof thumbnailUrl === 'string' && /^https?:\/\//i.test(thumbnailUrl.trim())
      ? thumbnailUrl.trim()
      : null

  return (
    <div
      className={cn(
        'max-w-lg mx-auto overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl',
        className
      )}
    >
      <div
        className="relative aspect-[16/11] overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${game.art.from}, ${game.art.to})`,
        }}
      >
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" unoptimized />
        ) : (
          <LaunchArt pattern={game.art.pattern} accent={game.art.accent} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800 shadow-sm">
          {game.categoryLabel}
        </span>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            {game.name}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-white/95">{game.shortTagline}</p>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          {game.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              <Zap className="h-3 w-3 text-amber-600" />
              {skill}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
            <Clock3 className="h-3 w-3" />~{game.estimatedMinutes} min · Lv 1–{game.maxLevel}
          </span>
        </div>

        {game.slug === 'color-word' ? (
          <p className="text-sm text-slate-600 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 leading-relaxed">
            How to play: ignore the letter meaning. Ask only — is the{' '}
            <span className="font-semibold text-slate-800">ink color</span> the same as the color
            name? Stage 1 uses just red, blue, green, yellow. Harder stages stay on popular color
            words.
          </p>
        ) : (
          <p className="text-sm text-slate-600 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 leading-relaxed">
            Clear YES/NO rounds across {game.maxLevel} stages. Reach about 70% accuracy to unlock the
            next stage.
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="h-14 w-full text-base font-bold bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 active:scale-[0.99]"
          onClick={onPlay}
        >
          <Play className="h-5 w-5 mr-2 fill-current" />
          Play
          <kbd className="ml-3 hidden sm:inline-flex rounded border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
            Enter
          </kbd>
        </Button>

        {onWarmup ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            onClick={onWarmup}
          >
            Warm-up · 3 free trials
          </Button>
        ) : null}

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-800 transition"
        >
          Back to Arcade
        </button>

        <p className="hidden md:block text-center text-[11px] text-slate-400">
          Y / N to answer · Esc ends run · R replays
        </p>
      </div>
    </div>
  )
}

function LaunchArt({
  pattern,
  accent,
}: {
  pattern: BrainGameDef['art']['pattern']
  accent: string
}) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {pattern === 'pulse' ? (
        <svg className="absolute inset-0 h-full w-full opacity-40">
          <circle cx="70%" cy="35%" r="70" fill="none" stroke="white" strokeWidth="10" />
          <circle cx="70%" cy="35%" r="28" fill="white" fillOpacity="0.35" />
          <circle cx="28%" cy="70%" r="40" fill={accent} fillOpacity="0.35" />
        </svg>
      ) : null}
      {pattern === 'dots' ? (
        <svg className="absolute inset-0 h-full w-full opacity-35">
          {Array.from({ length: 36 }).map((_, i) => (
            <circle
              key={i}
              cx={24 + (i % 9) * 36}
              cy={28 + Math.floor(i / 9) * 40}
              r="4"
              fill="white"
            />
          ))}
        </svg>
      ) : null}
      {pattern === 'waves' ? (
        <svg className="absolute inset-0 h-full w-full opacity-40">
          <path d="M0 90 Q60 40 120 90 T240 90 T360 90 V200 H0Z" fill="white" fillOpacity="0.2" />
          <path d="M0 120 Q60 70 120 120 T240 120 T360 120" fill="none" stroke="white" strokeWidth="3" />
        </svg>
      ) : null}
      {pattern === 'grid' ? (
        <svg className="absolute inset-0 h-full w-full opacity-30">
          <defs>
            <pattern id="launch-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#launch-grid)" />
        </svg>
      ) : null}
      {pattern === 'chips' ? (
        <svg className="absolute inset-0 h-full w-full opacity-35">
          <rect x="18%" y="25%" width="120" height="80" rx="8" fill="none" stroke="white" strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="12%"
              x2="18%"
              y1={`${38 + i * 10}%`}
              y2={`${38 + i * 10}%`}
              stroke="white"
              strokeWidth="3"
            />
          ))}
        </svg>
      ) : null}
      {pattern === 'ladder' ? (
        <svg className="absolute inset-0 h-full w-full opacity-35">
          {[40, 80, 120].map((y) => (
            <line key={y} x1="40" x2="300" y1={y} y2={y} stroke="white" strokeWidth="4" />
          ))}
          <line x1="60" x2="60" y1="30" y2="140" stroke="white" strokeWidth="4" />
          <line x1="280" x2="280" y1="30" y2="140" stroke="white" strokeWidth="4" />
        </svg>
      ) : null}
      {pattern === 'code' ? (
        <div className="absolute inset-0 p-8 font-mono text-sm leading-6 text-white/30 whitespace-pre">
          {`ready = True\nif ready:\n  play()\n  level_up()`}
        </div>
      ) : null}
      <div
        className="absolute bottom-20 right-6 h-16 w-16 rounded-2xl border border-white/25 shadow-lg"
        style={{ backgroundColor: accent }}
      />
    </div>
  )
}
