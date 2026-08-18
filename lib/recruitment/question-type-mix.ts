/**
 * Auto-select bank questions to match multiple / short / open percentages.
 *
 * Kinds:
 * - multiple: multiple_choice, multiple_select
 * - short: numeric, or short_text without guided marking (exact / brief)
 * - open: short_text with model answer / key points / guided marking
 */

import type { AnswerSpec } from '@/lib/recruitment/screening-parameters'
import type { BankQuestion } from '@/lib/recruitment/screening-materialize'
import { pickRandomSubset } from '@/lib/recruitment/screening-rng'

export type QuestionKind = 'multiple' | 'short' | 'open'

export type QuestionTypeMix = {
  multiple: number
  short: number
  open: number
}

export const DEFAULT_QUESTION_TYPE_MIX: QuestionTypeMix = {
  multiple: 50,
  short: 30,
  open: 20,
}

export function normalizeQuestionTypeMix(raw: unknown): QuestionTypeMix {
  const src =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  let multiple = Number(src.multiple)
  let short = Number(src.short)
  let open = Number(src.open)
  if (!Number.isFinite(multiple) || multiple < 0) multiple = DEFAULT_QUESTION_TYPE_MIX.multiple
  if (!Number.isFinite(short) || short < 0) short = DEFAULT_QUESTION_TYPE_MIX.short
  if (!Number.isFinite(open) || open < 0) open = DEFAULT_QUESTION_TYPE_MIX.open
  const sum = multiple + short + open
  if (sum <= 0) return { ...DEFAULT_QUESTION_TYPE_MIX }
  // Keep as percents summing to 100
  return {
    multiple: Math.round((multiple / sum) * 1000) / 10,
    short: Math.round((short / sum) * 1000) / 10,
    open: Math.round((open / sum) * 1000) / 10,
  }
}

export function classifyQuestionKind(question: {
  question_type: string
  answer_spec?: AnswerSpec | null
}): QuestionKind {
  const type = String(question.question_type ?? '')
  if (type === 'multiple_choice' || type === 'multiple_select') return 'multiple'
  if (type === 'numeric') return 'short'

  const spec = (question.answer_spec ?? {}) as AnswerSpec
  const guided =
    spec.useGuidedMarking === true ||
    spec.manualReview === true ||
    Boolean(spec.modelAnswer?.trim()) ||
    (Array.isArray(spec.keyPoints) &&
      spec.keyPoints.some((p) => String(p).trim().length > 0))

  if (type === 'short_text' && guided) return 'open'
  return 'short'
}

/** Largest-remainder allocation so counts sum exactly to total. */
export function allocateCountsFromMix(
  total: number,
  mix: QuestionTypeMix
): Record<QuestionKind, number> {
  const n = Math.max(0, Math.floor(total))
  if (n === 0) return { multiple: 0, short: 0, open: 0 }

  const normalized = normalizeQuestionTypeMix(mix)
  const kinds: QuestionKind[] = ['multiple', 'short', 'open']
  const exact = kinds.map((k) => ({
    k,
    value: (normalized[k] / 100) * n,
  }))
  const floors = exact.map((row) => ({
    k: row.k,
    n: Math.floor(row.value),
    frac: row.value - Math.floor(row.value),
  }))
  let assigned = floors.reduce((sum, row) => sum + row.n, 0)
  let remaining = n - assigned
  floors.sort((a, b) => b.frac - a.frac || a.k.localeCompare(b.k))
  for (let i = 0; i < floors.length && remaining > 0; i++) {
    floors[i]!.n += 1
    remaining -= 1
  }
  return {
    multiple: floors.find((r) => r.k === 'multiple')?.n ?? 0,
    short: floors.find((r) => r.k === 'short')?.n ?? 0,
    open: floors.find((r) => r.k === 'open')?.n ?? 0,
  }
}

/**
 * Pick questions to match type mix. Shortfalls refill from other kinds so the
 * session still reaches `total` when the bank is uneven.
 */
export function pickQuestionsByTypeMix(input: {
  pool: BankQuestion[]
  total: number
  mix: QuestionTypeMix
  seed: string
  excludeIds?: Set<string>
}): BankQuestion[] {
  const exclude = input.excludeIds ?? new Set<string>()
  const available = input.pool.filter((q) => !exclude.has(q.id))
  const total = Math.min(Math.max(0, Math.floor(input.total)), available.length)
  if (total === 0) return []

  const targets = allocateCountsFromMix(total, input.mix)
  const buckets: Record<QuestionKind, BankQuestion[]> = {
    multiple: [],
    short: [],
    open: [],
  }
  for (const q of available) {
    buckets[classifyQuestionKind(q)].push(q)
  }

  const picked: BankQuestion[] = []
  const used = new Set<string>()
  const kinds: QuestionKind[] = ['multiple', 'short', 'open']

  for (const kind of kinds) {
    const need = targets[kind]
    const chosen = pickRandomSubset(buckets[kind], need, `${input.seed}:mix:${kind}`)
    for (const q of chosen) {
      picked.push(q)
      used.add(q.id)
    }
  }

  if (picked.length < total) {
    const remainder = available.filter((q) => !used.has(q.id))
    const fill = pickRandomSubset(remainder, total - picked.length, `${input.seed}:mix:fill`)
    picked.push(...fill)
  }

  return picked.slice(0, total)
}

export function describeTypeMixCounts(total: number, mix: QuestionTypeMix): string {
  const counts = allocateCountsFromMix(total, mix)
  return `${counts.multiple} multiple · ${counts.short} short · ${counts.open} open`
}
