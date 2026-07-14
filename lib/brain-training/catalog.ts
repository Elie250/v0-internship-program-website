/** Static Brain Training catalog (UI + routing). DB supplies thumbnails & active flags. */

export type BrainGameCategory =
  | 'cognitive'
  | 'memory'
  | 'logic'
  | 'engineering'
  | 'electrical'
  | 'electronics'
  | 'embedded'
  | 'plc'
  | 'programming'

export type BrainGameSlug =
  | 'color-word'
  | 'sequence-match'
  | 'ohm-law'
  | 'circuit-symbols'
  | 'logic-gates'
  | 'plc-ladder'
  | 'code-trace'

export type GameArtTheme = {
  from: string
  to: string
  accent: string
  pattern: 'grid' | 'waves' | 'chips' | 'ladder' | 'code' | 'pulse' | 'dots'
}

export type BrainGameDef = {
  slug: BrainGameSlug
  name: string
  shortTagline: string
  category: BrainGameCategory
  categoryLabel: string
  skills: string[]
  maxLevel: number
  estimatedMinutes: number
  kind: 'custom' | 'quiz'
  /** For quiz engines */
  bankId?: BrainGameSlug
  art: GameArtTheme
}

export const BRAIN_GAME_CATALOG: readonly BrainGameDef[] = [
  {
    slug: 'color-word',
    name: 'Color-Word Rush',
    shortTagline: 'Ink vs word — stay sharp',
    category: 'cognitive',
    categoryLabel: 'Cognitive',
    skills: ['Attention', 'Speed'],
    maxLevel: 4,
    estimatedMinutes: 4,
    kind: 'custom',
    art: {
      from: '#0f2744',
      to: '#1d4ed8',
      accent: '#38bdf8',
      pattern: 'pulse',
    },
  },
  {
    slug: 'sequence-match',
    name: 'Sequence Spotter',
    shortTagline: 'Catch the one different digit',
    category: 'memory',
    categoryLabel: 'Memory',
    skills: ['Memory', 'Detail'],
    maxLevel: 4,
    estimatedMinutes: 4,
    kind: 'custom',
    art: {
      from: '#134e4a',
      to: '#0f766e',
      accent: '#5eead4',
      pattern: 'dots',
    },
  },
  {
    slug: 'ohm-law',
    name: "Ohm's Law Arena",
    shortTagline: 'Voltage · Current · Resistance',
    category: 'electrical',
    categoryLabel: 'Electrical',
    skills: ['V=IR', 'Basics'],
    maxLevel: 4,
    estimatedMinutes: 5,
    kind: 'quiz',
    bankId: 'ohm-law',
    art: {
      from: '#7c2d12',
      to: '#b45309',
      accent: '#fbbf24',
      pattern: 'waves',
    },
  },
  {
    slug: 'circuit-symbols',
    name: 'Circuit Symbol Match',
    shortTagline: 'Read the schematic language',
    category: 'electronics',
    categoryLabel: 'Electronics',
    skills: ['Symbols', 'Schematics'],
    maxLevel: 4,
    estimatedMinutes: 5,
    kind: 'quiz',
    bankId: 'circuit-symbols',
    art: {
      from: '#1e3a5f',
      to: '#0369a1',
      accent: '#7dd3fc',
      pattern: 'grid',
    },
  },
  {
    slug: 'logic-gates',
    name: 'Logic Gate Scrimmage',
    shortTagline: 'Think in highs and lows',
    category: 'embedded',
    categoryLabel: 'Embedded',
    skills: ['Gates', 'Digital'],
    maxLevel: 4,
    estimatedMinutes: 5,
    kind: 'quiz',
    bankId: 'logic-gates',
    art: {
      from: '#312e81',
      to: '#6d28d9',
      accent: '#c4b5fd',
      pattern: 'chips',
    },
  },
  {
    slug: 'plc-ladder',
    name: 'PLC Ladder Check',
    shortTagline: 'Contacts & coils — field ready',
    category: 'plc',
    categoryLabel: 'PLC',
    skills: ['Ladder', 'Contacts'],
    maxLevel: 4,
    estimatedMinutes: 5,
    kind: 'quiz',
    bankId: 'plc-ladder',
    art: {
      from: '#14532d',
      to: '#15803d',
      accent: '#86efac',
      pattern: 'ladder',
    },
  },
  {
    slug: 'code-trace',
    name: 'Code Trace Sprint',
    shortTagline: 'Read code. Predict output.',
    category: 'programming',
    categoryLabel: 'Programming',
    skills: ['Logic', 'Trace'],
    maxLevel: 4,
    estimatedMinutes: 5,
    kind: 'quiz',
    bankId: 'code-trace',
    art: {
      from: '#0f172a',
      to: '#334155',
      accent: '#94a3b8',
      pattern: 'code',
    },
  },
] as const

export function getGameDef(slug: string): BrainGameDef | undefined {
  return BRAIN_GAME_CATALOG.find((g) => g.slug === slug)
}

export function isBrainGameSlug(slug: string): slug is BrainGameSlug {
  return BRAIN_GAME_CATALOG.some((g) => g.slug === slug)
}

export const CATEGORY_FILTERS: { id: BrainGameCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'memory', label: 'Memory' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'embedded', label: 'Embedded' },
  { id: 'plc', label: 'PLC' },
  { id: 'programming', label: 'Coding' },
]
