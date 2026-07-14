/** Shared scoring + rank labels for Brain Training Academy. */

export type BrainGameSlug = 'color-word' | 'sequence-match'

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

  const accuracyScore = Math.round(accuracy * 8) // max ~800
  const speedRatio = Math.max(0, Math.min(1, 1 - averageResponseMs / maxPerQuestionMs))
  const speedBonus = Math.round(speedRatio * 200) // max 200
  const score = Math.max(0, accuracyScore + speedBonus)

  return { score, accuracy: Math.round(accuracy * 10) / 10, averageResponseMs }
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

export const COLOR_WORD_LEVELS = [
  { level: 1, questions: 10, seconds: 5, label: 'Foundation' },
  { level: 2, questions: 15, seconds: 4, label: 'Focused' },
  { level: 3, questions: 20, seconds: 3, label: 'Advanced' },
  { level: 4, questions: 25, seconds: 2, label: 'Expert' },
] as const

export const SEQUENCE_LEVELS = [
  { level: 1, length: 5, seconds: 5, questions: 10, label: 'Foundation' },
  { level: 2, length: 8, seconds: 4, questions: 12, label: 'Focused' },
  { level: 3, length: 12, seconds: 3, questions: 14, label: 'Advanced' },
  { level: 4, length: 16, seconds: 2, questions: 16, label: 'Expert' },
] as const

export const BASIC_COLORS = [
  { name: 'RED', hex: '#dc2626' },
  { name: 'BLUE', hex: '#2563eb' },
  { name: 'GREEN', hex: '#16a34a' },
  { name: 'YELLOW', hex: '#ca8a04' },
  { name: 'PURPLE', hex: '#7c3aed' },
  { name: 'ORANGE', hex: '#ea580c' },
] as const

export const SIMILAR_COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'CRIMSON', hex: '#b91c1c' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'NAVY', hex: '#1e3a5f' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'TEAL', hex: '#0d9488' },
  { name: 'ORANGE', hex: '#f97316' },
  { name: 'AMBER', hex: '#d97706' },
] as const
