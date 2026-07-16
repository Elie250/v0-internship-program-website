'use client'

import { cn } from '@/lib/utils'
import type { SchematicSymbolId } from '@/lib/brain-training/symbol-ids'

export type { SchematicSymbolId }

type Props = {
  id: SchematicSymbolId
  className?: string
  caption?: string
}

/** Clear IEC-style schematic glyphs (SVG) — not ASCII line art. */
export function SchematicSymbol({ id, className, caption }: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg
        viewBox="0 0 160 80"
        className="w-full max-w-[240px] h-auto text-slate-800"
        role="img"
        aria-label={caption || id}
      >
        <SymbolPaths id={id} />
      </svg>
      {caption ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{caption}</p>
      ) : null}
    </div>
  )
}

function SymbolPaths({ id }: { id: SchematicSymbolId }) {
  const stroke = { stroke: 'currentColor', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (id) {
    case 'resistor':
      return (
        <g {...stroke}>
          <path d="M10 40 H36 L44 24 L52 56 L60 24 L68 56 L76 24 L84 56 L92 24 L100 40 H150" />
        </g>
      )
    case 'capacitor':
      return (
        <g {...stroke}>
          <path d="M10 40 H70" />
          <path d="M70 18 V62" />
          <path d="M90 18 V62" />
          <path d="M90 40 H150" />
        </g>
      )
    case 'diode':
      return (
        <g {...stroke}>
          <path d="M10 40 H55" />
          <path d="M55 22 L95 40 L55 58 Z" fill="currentColor" fillOpacity={0.12} />
          <path d="M55 22 L95 40 L55 58 Z" />
          <path d="M95 22 V58" />
          <path d="M95 40 H150" />
        </g>
      )
    case 'led':
      return (
        <g {...stroke}>
          <path d="M10 40 H50" />
          <path d="M50 22 L88 40 L50 58 Z" fill="currentColor" fillOpacity={0.12} />
          <path d="M50 22 L88 40 L50 58 Z" />
          <path d="M88 22 V58" />
          <path d="M88 40 H150" />
          <path d="M108 18 L124 6" />
          <path d="M118 20 L134 8" />
          <path d="M120 8 L124 6 L120 12" />
          <path d="M130 10 L134 8 L130 14" />
        </g>
      )
    case 'zener':
      return (
        <g {...stroke}>
          <path d="M10 40 H55" />
          <path d="M55 22 L95 40 L55 58 Z" fill="currentColor" fillOpacity={0.12} />
          <path d="M55 22 L95 40 L55 58 Z" />
          <path d="M95 22 V58" />
          <path d="M95 22 H105" />
          <path d="M95 58 H85" />
          <path d="M95 40 H150" />
        </g>
      )
    case 'inductor':
      return (
        <g {...stroke}>
          <path d="M10 40 H40" />
          <path d="M40 40 a12 12 0 0 1 24 0 a12 12 0 0 1 24 0 a12 12 0 0 1 24 0 a12 12 0 0 1 24 0" />
          <path d="M136 40 H150" />
        </g>
      )
    case 'battery':
      return (
        <g {...stroke}>
          <path d="M10 40 H55" />
          <path d="M55 22 V58" strokeWidth={3.5} />
          <path d="M70 30 V50" />
          <path d="M85 22 V58" strokeWidth={3.5} />
          <path d="M100 30 V50" />
          <path d="M100 40 H150" />
          <text x="48" y="16" fontSize="11" fill="currentColor" fontWeight="700">+</text>
          <text x="88" y="16" fontSize="11" fill="currentColor" fontWeight="700">−</text>
        </g>
      )
    case 'ground':
      return (
        <g {...stroke}>
          <path d="M80 12 V42" />
          <path d="M50 42 H110" />
          <path d="M58 52 H102" />
          <path d="M68 62 H92" />
        </g>
      )
    case 'lamp':
      return (
        <g {...stroke}>
          <path d="M10 40 H40" />
          <circle cx="80" cy="40" r="28" />
          <path d="M60 20 L100 60" />
          <path d="M100 20 L60 60" />
          <path d="M120 40 H150" />
        </g>
      )
    case 'npn':
      return (
        <g {...stroke}>
          <path d="M20 40 H55" />
          <path d="M55 18 V62" strokeWidth={3} />
          <path d="M55 30 L95 18" />
          <path d="M55 50 L95 62" />
          <path d="M95 18 V8" />
          <path d="M95 62 V72" />
          <path d="M88 54 L95 62 L85 60" fill="currentColor" />
          <text x="100" y="14" fontSize="10" fill="currentColor">C</text>
          <text x="100" y="74" fontSize="10" fill="currentColor">E</text>
          <text x="8" y="44" fontSize="10" fill="currentColor">B</text>
        </g>
      )
    case 'pnp':
      return (
        <g {...stroke}>
          <path d="M20 40 H55" />
          <path d="M55 18 V62" strokeWidth={3} />
          <path d="M55 30 L95 18" />
          <path d="M55 50 L95 62" />
          <path d="M95 18 V8" />
          <path d="M95 62 V72" />
          <path d="M62 34 L55 30 L65 28" fill="currentColor" />
          <text x="100" y="14" fontSize="10" fill="currentColor">C</text>
          <text x="100" y="74" fontSize="10" fill="currentColor">E</text>
          <text x="8" y="44" fontSize="10" fill="currentColor">B</text>
        </g>
      )
    case 'switch':
      return (
        <g {...stroke}>
          <path d="M10 40 H50" />
          <circle cx="50" cy="40" r="4" fill="currentColor" />
          <path d="M54 38 L100 22" />
          <circle cx="110" cy="40" r="4" fill="currentColor" />
          <path d="M114 40 H150" />
        </g>
      )
    case 'fuse':
      return (
        <g {...stroke}>
          <path d="M10 40 H40" />
          <rect x="40" y="28" width="80" height="24" rx="4" />
          <path d="M52 40 H108" />
          <path d="M120 40 H150" />
        </g>
      )
    case 'transformer':
      return (
        <g {...stroke}>
          <path d="M10 40 H30" />
          <path d="M30 40 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0" />
          <path d="M90 18 V62" />
          <path d="M98 18 V62" />
          <path d="M106 40 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0" />
          <path d="M146 40 H155" />
        </g>
      )
    case 'ac':
      return (
        <g {...stroke}>
          <path d="M10 40 H36" />
          <circle cx="80" cy="40" r="30" />
          <path d="M58 40 q11 -18 22 0 q11 18 22 0" />
          <path d="M124 40 H150" />
        </g>
      )
    case 'potentiometer':
      return (
        <g {...stroke}>
          <path d="M10 40 H36 L44 24 L52 56 L60 24 L68 56 L76 24 L84 56 L92 40 H150" />
          <path d="M68 8 V24" />
          <path d="M62 16 L68 8 L74 16" />
        </g>
      )
    case 'motor':
      return (
        <g {...stroke}>
          <path d="M10 40 H40" />
          <circle cx="80" cy="40" r="28" />
          <text x="80" y="46" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">
            M
          </text>
          <path d="M120 40 H150" />
        </g>
      )
    case 'and':
      return (
        <g {...stroke}>
          <path d="M30 16 H70 Q110 16 110 40 Q110 64 70 64 H30 Z" fill="currentColor" fillOpacity={0.08} />
          <path d="M30 16 H70 Q110 16 110 40 Q110 64 70 64 H30 Z" />
          <path d="M10 28 H30" />
          <path d="M10 52 H30" />
          <path d="M110 40 H150" />
        </g>
      )
    case 'or':
      return (
        <g {...stroke}>
          <path d="M34 16 Q58 16 78 28 Q98 40 78 52 Q58 64 34 64 Q48 40 34 16 Z" fill="currentColor" fillOpacity={0.08} />
          <path d="M34 16 Q58 16 78 28 Q110 40 78 52 Q58 64 34 64 Q48 40 34 16" />
          <path d="M10 28 H40" />
          <path d="M10 52 H40" />
          <path d="M108 40 H150" />
        </g>
      )
    case 'not':
      return (
        <g {...stroke}>
          <path d="M30 16 L100 40 L30 64 Z" fill="currentColor" fillOpacity={0.08} />
          <path d="M30 16 L100 40 L30 64 Z" />
          <circle cx="112" cy="40" r="8" />
          <path d="M10 40 H30" />
          <path d="M120 40 H150" />
        </g>
      )
    case 'nand':
      return (
        <g {...stroke}>
          <path d="M24 16 H64 Q100 16 100 40 Q100 64 64 64 H24 Z" fill="currentColor" fillOpacity={0.08} />
          <path d="M24 16 H64 Q100 16 100 40 Q100 64 64 64 H24 Z" />
          <circle cx="112" cy="40" r="8" />
          <path d="M8 28 H24" />
          <path d="M8 52 H24" />
          <path d="M120 40 H150" />
        </g>
      )
    case 'nor':
      return (
        <g {...stroke}>
          <path d="M30 16 Q54 16 74 28 Q94 40 74 52 Q54 64 30 64 Q44 40 30 16" />
          <circle cx="108" cy="40" r="8" />
          <path d="M8 28 H36" />
          <path d="M8 52 H36" />
          <path d="M116 40 H150" />
        </g>
      )
    case 'xor':
      return (
        <g {...stroke}>
          <path d="M24 16 Q40 40 24 64" />
          <path d="M36 16 Q60 16 80 28 Q110 40 80 52 Q60 64 36 64 Q50 40 36 16" />
          <path d="M8 28 H30" />
          <path d="M8 52 H30" />
          <path d="M108 40 H150" />
        </g>
      )
    default:
      return null
  }
}
