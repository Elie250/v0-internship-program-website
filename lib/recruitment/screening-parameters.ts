/**
 * Dynamic technical parameter resolution for screening questions.
 * Parameters are generated server-side from a session seed and persisted on session items.
 */

import { createSeededRng, randomInRange } from '@/lib/recruitment/screening-rng'

export type ParameterDefinition = {
  key: string
  label?: string
  type?: 'number' | 'integer'
  min: number
  max: number
  decimals?: number
  unit?: string
  /** Optional discrete choices instead of continuous range */
  choices?: number[]
}

export type AnswerSpec = {
  /** For multiple_choice: correct option id */
  correctOptionId?: string
  /** For multiple_select: correct option ids */
  correctOptionIds?: string[]
  /** Numeric: expression using parameter keys, e.g. "V * I / eta" */
  expression?: string
  /** Absolute tolerance for numeric answers */
  tolerance?: number
  /** Relative tolerance (fraction of expected), e.g. 0.02 = 2% */
  relativeTolerance?: number
  decimals?: number
  /** Short text: case-insensitive exact matches */
  acceptedAnswers?: string[]
  /** If true, short_text cannot be auto-scored (human marks only) */
  manualReview?: boolean
  /**
   * Guided open-ended marking.
   * With modelAnswer and/or keyPoints, the local heuristic auto-marks at submit
   * so the candidate gets a final technical score. Hiring staff can override.
   * Optional AI is for re-suggest / review only — never required for auto-mark.
   */
  modelAnswer?: string
  /** Concepts the candidate answer should cover (used for auto-mark + overrides). */
  keyPoints?: string[]
  /** Free-text marking notes / rubric for the hiring team (and optional AI). */
  markingRubric?: string
  /** Prefer guided auto-mark path when key points / model answer are present */
  useGuidedMarking?: boolean
}

function tokenizeExpression(expr: string): string[] {
  return expr.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()]/g) ?? []
}

/**
 * Safe arithmetic evaluator for answer expressions.
 * Supports + - * / ( ) and parameter identifiers only.
 */
export function evaluateAnswerExpression(
  expression: string,
  params: Record<string, number>
): number | null {
  const tokens = tokenizeExpression(expression.trim())
  if (!tokens.length) return null

  let i = 0
  const peek = () => tokens[i]
  const consume = () => tokens[i++]

  function parsePrimary(): number | null {
    const t = peek()
    if (t === '(') {
      consume()
      const v = parseExpr()
      if (peek() !== ')') return null
      consume()
      return v
    }
    if (t === '-') {
      consume()
      const v = parsePrimary()
      return v == null ? null : -v
    }
    if (!t) return null
    if (/^\d/.test(t)) {
      consume()
      return Number(t)
    }
    if (/^[A-Za-z_]/.test(t)) {
      consume()
      if (!(t in params)) return null
      return params[t]
    }
    return null
  }

  function parseTerm(): number | null {
    let left = parsePrimary()
    if (left == null) return null
    while (peek() === '*' || peek() === '/') {
      const op = consume()
      const right = parsePrimary()
      if (right == null) return null
      left = op === '*' ? left * right : right === 0 ? null : left / right
      if (left == null) return null
    }
    return left
  }

  function parseExpr(): number | null {
    let left = parseTerm()
    if (left == null) return null
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const right = parseTerm()
      if (right == null) return null
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  const value = parseExpr()
  if (value == null || i !== tokens.length) return null
  if (!Number.isFinite(value)) return null
  return value
}

export function resolveParameters(
  definitions: ParameterDefinition[],
  seed: string
): Record<string, number> {
  const rng = createSeededRng(`params:${seed}`)
  const resolved: Record<string, number> = {}
  for (const def of definitions) {
    if (Array.isArray(def.choices) && def.choices.length > 0) {
      const idx = Math.floor(rng() * def.choices.length)
      resolved[def.key] = def.choices[idx]!
      continue
    }
    const decimals = def.type === 'integer' ? 0 : (def.decimals ?? 2)
    resolved[def.key] = randomInRange(rng, def.min, def.max, decimals)
  }
  return resolved
}

export function applyParametersToPrompt(
  template: string,
  params: Record<string, number>,
  definitions: ParameterDefinition[] = []
): string {
  let text = template
  for (const [key, value] of Object.entries(params)) {
    const def = definitions.find((d) => d.key === key)
    const unit = def?.unit ? ` ${def.unit}` : ''
    const formatted = Number.isInteger(value) ? String(value) : String(value)
    text = text.replaceAll(`{${key}}`, `${formatted}${unit}`.trimEnd())
  }
  return text
}

export function resolveExpectedNumeric(
  answerSpec: AnswerSpec,
  params: Record<string, number>
): { value: number; tolerance: number } | null {
  if (!answerSpec.expression) return null
  const raw = evaluateAnswerExpression(answerSpec.expression, params)
  if (raw == null) return null
  const decimals = answerSpec.decimals ?? 4
  const factor = 10 ** decimals
  const value = Math.round(raw * factor) / factor
  const absTol = answerSpec.tolerance ?? 0
  const relTol =
    answerSpec.relativeTolerance != null ? Math.abs(value) * answerSpec.relativeTolerance : 0
  return { value, tolerance: Math.max(absTol, relTol) }
}

export function publicParameters(
  params: Record<string, number>,
  definitions: ParameterDefinition[]
): Array<{ key: string; label: string; value: number; unit?: string }> {
  return definitions.map((def) => ({
    key: def.key,
    label: def.label || def.key,
    value: params[def.key]!,
    unit: def.unit,
  }))
}
