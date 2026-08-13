/**
 * Academy STEM question variants — server-side parameter resolution.
 * Reuses Talent parameter math; never exposes answer keys to the client.
 */

import {
  applyParametersToPrompt,
  evaluateAnswerExpression,
  resolveParameters,
  type AnswerSpec,
  type ParameterDefinition,
} from '@/lib/recruitment/screening-parameters'
import { createSeededRng, shuffleWithSeed } from '@/lib/recruitment/screening-rng'

export type AcademyQuestionVariantSource = {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation?: string | null
  parameters?: unknown
  answer_spec?: unknown
}

export type MaterializedQuestionVariant = {
  questionId: string
  question: string
  options: string[]
  /** Correct index in the materialized options array (before display shuffle) */
  correctIndex: number
  params: Record<string, number>
  usedDynamicOptions: boolean
}

export function parseParameterDefinitions(raw: unknown): ParameterDefinition[] {
  if (!Array.isArray(raw)) return []
  const out: ParameterDefinition[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const key = String(row.key ?? '').trim()
    if (!key) continue
    const min = Number(row.min)
    const max = Number(row.max)
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue
    out.push({
      key,
      label: row.label != null ? String(row.label) : undefined,
      type: row.type === 'integer' ? 'integer' : 'number',
      min,
      max,
      decimals: row.decimals != null ? Number(row.decimals) : undefined,
      unit: row.unit != null ? String(row.unit) : undefined,
      choices: Array.isArray(row.choices)
        ? row.choices.map(Number).filter((n) => Number.isFinite(n))
        : undefined,
    })
  }
  return out
}

export function parseAnswerSpec(raw: unknown): AnswerSpec & { distractorExpressions?: string[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const row = raw as Record<string, unknown>
  const distractors = Array.isArray(row.distractorExpressions)
    ? row.distractorExpressions.map((d) => String(d).trim()).filter(Boolean)
    : Array.isArray(row.distractors)
      ? row.distractors.map((d) => String(d).trim()).filter(Boolean)
      : []
  return {
    expression: row.expression != null ? String(row.expression).trim() : undefined,
    tolerance: row.tolerance != null ? Number(row.tolerance) : undefined,
    relativeTolerance: row.relativeTolerance != null ? Number(row.relativeTolerance) : undefined,
    decimals: row.decimals != null ? Number(row.decimals) : undefined,
    distractorExpressions: distractors,
  }
}

function formatValue(value: number, decimals = 2): string {
  if (Number.isInteger(value)) return String(value)
  const factor = 10 ** decimals
  return String(Math.round(value * factor) / factor)
}

/**
 * Materialize one question for an attempt seed.
 * Prefer expression + distractors when present; otherwise substitute {key} in text/options.
 */
export function materializeQuestionVariant(
  source: AcademyQuestionVariantSource,
  seed: string
): MaterializedQuestionVariant {
  const defs = parseParameterDefinitions(source.parameters)
  const params = defs.length ? resolveParameters(defs, `${seed}:${source.id}`) : {}
  const spec = parseAnswerSpec(source.answer_spec)

  if (spec.expression && (spec.distractorExpressions?.length ?? 0) > 0) {
    const decimals = spec.decimals ?? 2
    const correct = evaluateAnswerExpression(spec.expression, params)
    if (correct != null) {
      const values = [correct]
      for (const expr of spec.distractorExpressions ?? []) {
        const v = evaluateAnswerExpression(expr, params)
        if (v != null && !values.some((x) => Math.abs(x - v) < 1e-9)) values.push(v)
      }
      // Ensure at least 2 options
      while (values.length < 2) {
        values.push(correct + values.length)
      }
      const options = values.map((v) => formatValue(v, decimals))
      const question = applyParametersToPrompt(String(source.question), params, defs)
      return {
        questionId: source.id,
        question,
        options,
        correctIndex: 0,
        params,
        usedDynamicOptions: true,
      }
    }
  }

  const question = applyParametersToPrompt(String(source.question), params, defs)
  const options = (Array.isArray(source.options) ? source.options : []).map((opt) =>
    applyParametersToPrompt(String(opt), params, defs)
  )
  return {
    questionId: source.id,
    question,
    options,
    correctIndex: Number(source.correct_index) || 0,
    params,
    usedDynamicOptions: false,
  }
}

export function materializeAttemptVariants(
  questions: AcademyQuestionVariantSource[],
  variantSeed: string
): {
  byQuestionId: Record<
    string,
    {
      params: Record<string, number>
      options: string[]
      correctIndex: number
      question: string
      usedDynamicOptions: boolean
    }
  >
} {
  const byQuestionId: Record<
    string,
    {
      params: Record<string, number>
      options: string[]
      correctIndex: number
      question: string
      usedDynamicOptions: boolean
    }
  > = {}

  for (const q of questions) {
    const m = materializeQuestionVariant(q, variantSeed)
    byQuestionId[q.id] = {
      params: m.params,
      options: m.options,
      correctIndex: m.correctIndex,
      question: m.question,
      usedDynamicOptions: m.usedDynamicOptions,
    }
  }
  return { byQuestionId }
}

/** Deterministic option order using attempt seed (when shuffleOptions is on). */
export function seededOptionOrder(optionCount: number, seed: string, shuffle: boolean): number[] {
  const base = Array.from({ length: optionCount }, (_, i) => i)
  if (!shuffle || optionCount <= 1) return base
  return shuffleWithSeed(base, seed)
}

export function newVariantSeed(attemptNumber: number, userId: string, assessmentId: string): string {
  const rng = createSeededRng(`${assessmentId}:${userId}:${attemptNumber}:${Date.now()}`)
  return `v_${Math.floor(rng() * 1e9).toString(36)}_${attemptNumber}`
}
