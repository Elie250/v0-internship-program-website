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

/** Color-Word: 10 stages. 1–4 classic; 5–10 multi-line bridge (first ink vs last meaning). */
export const COLOR_WORD_LEVELS: readonly StageConfig[] = [
  { level: 1, questions: 8, seconds: 9, label: 'Starter' },
  { level: 2, questions: 9, seconds: 8, label: 'Foundation' },
  { level: 3, questions: 10, seconds: 7, label: 'Steady' },
  { level: 4, questions: 12, seconds: 6, label: 'Focused' },
  { level: 5, questions: 12, seconds: 7, label: 'Bridge' },
  { level: 6, questions: 13, seconds: 6.5, label: 'Lines' },
  { level: 7, questions: 14, seconds: 5.5, label: 'Busy' },
  { level: 8, questions: 15, seconds: 5, label: 'Sharp' },
  { level: 9, questions: 16, seconds: 4.2, label: 'Elite' },
  { level: 10, questions: 18, seconds: 3.5, label: 'Master' },
]

/** Sequence Spotter: 10 stages. 1–4 pair compare; 5–10 multi-line (first vs last). */
export const SEQUENCE_LEVELS = [
  { level: 1, length: 4, seconds: 9, questions: 8, label: 'Starter' },
  { level: 2, length: 5, seconds: 8, questions: 9, label: 'Foundation' },
  { level: 3, length: 6, seconds: 7, questions: 10, label: 'Steady' },
  { level: 4, length: 8, seconds: 6, questions: 12, label: 'Focused' },
  { level: 5, length: 8, seconds: 7, questions: 12, label: 'Bridge' },
  { level: 6, length: 9, seconds: 6.5, questions: 13, label: 'Lines' },
  { level: 7, length: 10, seconds: 5.5, questions: 14, label: 'Busy' },
  { level: 8, length: 11, seconds: 5, questions: 15, label: 'Sharp' },
  { level: 9, length: 12, seconds: 4.2, questions: 16, label: 'Elite' },
  { level: 10, length: 14, seconds: 3.5, questions: 18, label: 'Master' },
] as const

/** How many distraction lines for multi-line modes (2–5). */
export function bridgeLineCount(level: number): number {
  if (level <= 4) return 1
  if (level === 5) return Math.random() < 0.55 ? 2 : 3
  if (level === 6) return Math.random() < 0.45 ? 2 : 3
  if (level === 7) return Math.random() < 0.5 ? 3 : 4
  if (level === 8) return 4
  if (level === 9) return Math.random() < 0.5 ? 4 : 5
  return 5
}

/**
 * YES/NO engineering drills — six stages.
 * Stages 1–3: roomy timers. Later stages: tighter clocks + harder items.
 */
export const QUIZ_LEVELS: readonly StageConfig[] = [
  { level: 1, questions: 8, seconds: 12, label: 'Starter' },
  { level: 2, questions: 10, seconds: 10, label: 'Foundation' },
  { level: 3, questions: 12, seconds: 8, label: 'Steady' },
  { level: 4, questions: 14, seconds: 5.5, label: 'Focused' },
  { level: 5, questions: 16, seconds: 4.2, label: 'Sharp' },
  { level: 6, questions: 18, seconds: 3.2, label: 'Pro' },
]

/** Pass threshold to unlock the next stage (shown in stage-gate popup). */
export const STAGE_PASS_ACCURACY = 0.7

export type ColorEntry = { name: string; hex: string; onDark?: boolean }

/**
 * High-contrast palette — no brown/orange/yellow (too easy to confuse).
 * WHITE uses onDark so ink stays readable.
 */
export const STARTER_COLORS: readonly ColorEntry[] = [
  { name: 'RED', hex: '#e11d48' },
  { name: 'BLUE', hex: '#1d4ed8' },
  { name: 'GREEN', hex: '#15803d' },
  { name: 'PURPLE', hex: '#7c3aed' },
]

export const POPULAR_COLORS: readonly ColorEntry[] = [
  { name: 'RED', hex: '#e11d48' },
  { name: 'BLUE', hex: '#1d4ed8' },
  { name: 'GREEN', hex: '#15803d' },
  { name: 'PURPLE', hex: '#7c3aed' },
  { name: 'PINK', hex: '#db2777' },
  { name: 'CYAN', hex: '#0891b2' },
  { name: 'BLACK', hex: '#0f172a' },
  { name: 'WHITE', hex: '#f8fafc', onDark: true },
]

/** @deprecated use STARTER_COLORS / POPULAR_COLORS — kept for older imports */
export const BASIC_COLORS = POPULAR_COLORS
/** @deprecated hard mode no longer uses obscure names */
export const SIMILAR_COLORS = POPULAR_COLORS

export function colorsForColorWordLevel(level: number): readonly ColorEntry[] {
  if (level <= 1) return STARTER_COLORS
  if (level <= 3) return POPULAR_COLORS.slice(0, 6)
  return POPULAR_COLORS
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
