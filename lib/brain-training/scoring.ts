/** Shared scoring + rank labels for Brain Training Academy. */

export type { BrainGameSlug } from '@/lib/brain-training/catalog'
import type { BrainGameSlug } from '@/lib/brain-training/catalog'

export type GameResultPayload = {
  gameSlug: BrainGameSlug
  score: number
  accuracy: number
  averageResponseMs: number
  timeTakenMs: number
  levelCompleted: number
  correctCount: number
  totalQuestions: number
}

export type StageConfig = {
  level: number
  questions: number
  seconds: number
  label: string
}

export function computeScore(params: {
  correct: number
  total: number
  responseTimesMs: number[]
  maxPerQuestionMs: number
}): { score: number; accuracy: number; averageResponseMs: number } {
  const { correct, total, responseTimesMs, maxPerQuestionMs } = params
  const accuracy = total > 0 ? (correct / total) * 100 : 0
  const answered = responseTimesMs.filter((t) => t > 0)
  const averageResponseMs =
    answered.length > 0
      ? Math.round(answered.reduce((a, b) => a + b, 0) / answered.length)
      : maxPerQuestionMs

  const safeMax = Math.max(1, maxPerQuestionMs || 1)
  const accuracyScore = Math.round(accuracy * 8) // max ~800
  const speedRatio = Math.max(0, Math.min(1, 1 - averageResponseMs / safeMax))
  const speedBonus = Math.round(speedRatio * 200) // max 200
  const score = Math.max(0, accuracyScore + speedBonus)

  return {
    score,
    accuracy: Math.round(accuracy * 10) / 10,
    averageResponseMs: Number.isFinite(averageResponseMs) ? averageResponseMs : safeMax,
  }
}

export function rankLabel(accuracy: number, averageResponseMs: number): string {
  if (accuracy >= 90 && averageResponseMs <= 1500) return 'Elite Focus'
  if (accuracy >= 85 && averageResponseMs <= 2200) return 'Advanced Thinker'
  if (accuracy >= 70) return 'Solid Performer'
  if (accuracy >= 50) return 'Developing Focus'
  return 'Keep Training'
}

export function xpFromScore(score: number): number {
  return Math.round(score)
}

/** Color-Word: harder = faster / more trials — still popular English color words. */
export const COLOR_WORD_LEVELS: readonly StageConfig[] = [
  { level: 1, questions: 8, seconds: 6, label: 'Starter' },
  { level: 2, questions: 10, seconds: 5, label: 'Foundation' },
  { level: 3, questions: 12, seconds: 4.5, label: 'Steady' },
  { level: 4, questions: 14, seconds: 4, label: 'Focused' },
  { level: 5, questions: 16, seconds: 3.5, label: 'Sharp' },
  { level: 6, questions: 18, seconds: 3, label: 'Pro' },
]

export const SEQUENCE_LEVELS = [
  { level: 1, length: 4, seconds: 6, questions: 8, label: 'Starter' },
  { level: 2, length: 5, seconds: 5, questions: 10, label: 'Foundation' },
  { level: 3, length: 7, seconds: 4.5, questions: 12, label: 'Steady' },
  { level: 4, length: 9, seconds: 4, questions: 14, label: 'Focused' },
  { level: 5, length: 12, seconds: 3.5, questions: 16, label: 'Sharp' },
  { level: 6, length: 14, seconds: 3, questions: 18, label: 'Pro' },
] as const

/**
 * YES/NO engineering drills — six stages.
 * Early stages: more thinking time for basic knowledge.
 * Later stages: tighter clocks for harder items.
 */
export const QUIZ_LEVELS: readonly StageConfig[] = [
  { level: 1, questions: 8, seconds: 9, label: 'Starter' },
  { level: 2, questions: 10, seconds: 8, label: 'Foundation' },
  { level: 3, questions: 12, seconds: 6.5, label: 'Steady' },
  { level: 4, questions: 14, seconds: 5.5, label: 'Focused' },
  { level: 5, questions: 16, seconds: 4.5, label: 'Sharp' },
  { level: 6, questions: 18, seconds: 3.5, label: 'Pro' },
]

export type ColorEntry = { name: string; hex: string }

/** Level 1 only — very few, universally known words. */
export const STARTER_COLORS: readonly ColorEntry[] = [
  { name: 'RED', hex: '#dc2626' },
  { name: 'BLUE', hex: '#2563eb' },
  { name: 'GREEN', hex: '#16a34a' },
  { name: 'YELLOW', hex: '#ca8a04' },
]

/**
 * All other stages (including hard) — popular color words only.
 * Aimed at beginners / non-fluent English speakers (no crimson/navy/teal/etc.).
 */
export const POPULAR_COLORS: readonly ColorEntry[] = [
  { name: 'RED', hex: '#dc2626' },
  { name: 'BLUE', hex: '#2563eb' },
  { name: 'GREEN', hex: '#16a34a' },
  { name: 'YELLOW', hex: '#ca8a04' },
  { name: 'ORANGE', hex: '#ea580c' },
  { name: 'BLACK', hex: '#171717' },
  { name: 'PINK', hex: '#db2777' },
  { name: 'BROWN', hex: '#92400e' },
]

/** @deprecated use STARTER_COLORS / POPULAR_COLORS — kept for older imports */
export const BASIC_COLORS = POPULAR_COLORS
/** @deprecated hard mode no longer uses obscure names */
export const SIMILAR_COLORS = POPULAR_COLORS

export function colorsForColorWordLevel(level: number): readonly ColorEntry[] {
  return level <= 1 ? STARTER_COLORS : POPULAR_COLORS
}

/** Softens high levels slightly on touch / narrow screens. */
export function playSeconds(baseSeconds: number, isTouchLayout: boolean): number {
  if (!isTouchLayout) return baseSeconds
  return Math.round((baseSeconds + 0.75) * 10) / 10
}

/** Actionable coaching copy for the post-session report. */
export function coachingInsight(accuracy: number, averageResponseMs: number): string {
  if (accuracy >= 90 && averageResponseMs <= 1500) {
    return 'Elite profile — keep that calm pace; precision and speed are already balanced.'
  }
  if (accuracy >= 85 && averageResponseMs > 2200) {
    return 'Strong accuracy. Next: answer a little faster once you are sure — trust the first clear read.'
  }
  if (accuracy >= 70 && averageResponseMs <= 1800) {
    return 'Good pace. For Color-Word, look at ink color first, then check the word.'
  }
  if (accuracy >= 70) {
    return 'Solid baseline. Push for 85%+ before racing the clock — consistency beats rushing.'
  }
  if (accuracy >= 50) {
    return 'Developing focus. Replay Starter levels slowly. Prefer correct YES/NO over speed.'
  }
  return 'Warm up again on Level 1. Read once, then answer — do not change mid-answer.'
}
