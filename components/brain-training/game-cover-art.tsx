import type { BrainGameDef, GameArtTheme } from '@/lib/brain-training/catalog'

type Pattern = GameArtTheme['pattern']

function ArtPattern({ pattern, patternId }: { pattern: Pattern; patternId: string }) {
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
  // pulse (Color-Word default)
  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
      <circle cx="70%" cy="35%" r="28" fill="none" stroke="white" strokeWidth="6" />
      <circle cx="70%" cy="35%" r="8" fill="white" />
      <circle cx="28%" cy="70%" r="18" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

/** Game thumbnail fallback — looks like Arcade covers when no upload exists. */
export function GameCoverArt({
  art,
  patternId,
  className,
}: {
  art: Pick<BrainGameDef['art'], 'from' | 'to' | 'accent' | 'pattern'>
  patternId: string
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(145deg, ${art.from}, ${art.to})`,
      }}
    >
      <ArtPattern pattern={art.pattern} patternId={patternId} />
      <div
        className="absolute bottom-3 left-3 h-9 w-9 rounded-xl border border-white/40 shadow-sm"
        style={{ backgroundColor: art.accent }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
    </div>
  )
}
