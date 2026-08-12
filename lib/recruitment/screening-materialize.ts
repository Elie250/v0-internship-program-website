/**
 * Materialize screening questions into immutable session items.
 */

import { pickRandomSubset, shuffleWithSeed } from '@/lib/recruitment/screening-rng'
import {
  applyParametersToPrompt,
  resolveExpectedNumeric,
  resolveParameters,
  type AnswerSpec,
  type ParameterDefinition,
} from '@/lib/recruitment/screening-parameters'
import type { QuestionType } from '@/lib/recruitment/screening-scoring'

export type QuestionOption = { id: string; label: string }

export type BankQuestion = {
  id: string
  prompt: string
  question_type: QuestionType
  options: QuestionOption[]
  parameters: ParameterDefinition[]
  answer_spec: AnswerSpec
  answer_key?: string | null
  weight: number
  section: string | null
  discipline: string | null
  difficulty: string | null
  expected_time_seconds: number | null
  owner_type: string
  organization_id: string | null
}

export type MaterializedItem = {
  question_id: string
  sort_order: number
  question_type: QuestionType
  section: string | null
  category: string | null
  difficulty: string | null
  weight: number
  expected_time_sec: number | null
  resolved_prompt: string
  options_snapshot: QuestionOption[]
  option_order: string[]
  parameters_resolved: Record<string, number>
  expected_answer: Record<string, unknown>
  max_points: number
}

function parseOptions(raw: unknown): QuestionOption[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const id = String(obj.id ?? `opt_${index}`)
      const label = String(obj.label ?? obj.text ?? '')
      if (!label) return null
      return { id, label }
    })
    .filter(Boolean) as QuestionOption[]
}

function parseParameters(raw: unknown): ParameterDefinition[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const key = String(obj.key ?? '').trim()
      if (!key) return null
      return {
        key,
        label: obj.label != null ? String(obj.label) : undefined,
        type: obj.type === 'integer' ? 'integer' : 'number',
        min: Number(obj.min ?? 0),
        max: Number(obj.max ?? 1),
        decimals: obj.decimals != null ? Number(obj.decimals) : undefined,
        unit: obj.unit != null ? String(obj.unit) : undefined,
        choices: Array.isArray(obj.choices) ? obj.choices.map(Number) : undefined,
      } satisfies ParameterDefinition
    })
    .filter(Boolean) as ParameterDefinition[]
}

function parseAnswerSpec(raw: unknown, answerKey?: string | null): AnswerSpec {
  const base: AnswerSpec =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? ({ ...(raw as AnswerSpec) } as AnswerSpec) : {}
  if (!base.acceptedAnswers && answerKey?.trim()) {
    base.acceptedAnswers = [answerKey.trim()]
  }
  if (!base.correctOptionId && answerKey?.trim() && !base.expression) {
    // Legacy: answer_key may store option id
    if (!base.acceptedAnswers) base.correctOptionId = answerKey.trim()
  }
  return base
}

export function normalizeBankQuestion(row: Record<string, unknown>): BankQuestion {
  const type = String(row.question_type ?? 'short_text') as QuestionType
  return {
    id: String(row.id),
    prompt: String(row.prompt ?? ''),
    question_type:
      type === 'multiple_choice' ||
      type === 'multiple_select' ||
      type === 'numeric' ||
      type === 'short_text'
        ? type
        : 'short_text',
    options: parseOptions(row.options),
    parameters: parseParameters(row.parameters),
    answer_spec: parseAnswerSpec(row.answer_spec, row.answer_key != null ? String(row.answer_key) : null),
    answer_key: row.answer_key != null ? String(row.answer_key) : null,
    weight: Number(row.weight ?? 1) || 1,
    section: row.section != null ? String(row.section) : row.discipline != null ? String(row.discipline) : null,
    discipline: row.discipline != null ? String(row.discipline) : null,
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    expected_time_seconds:
      row.expected_time_seconds != null ? Number(row.expected_time_seconds) : null,
    owner_type: String(row.owner_type ?? 'organization'),
    organization_id: row.organization_id != null ? String(row.organization_id) : null,
  }
}

export function selectQuestionsForSession(input: {
  pool: BankQuestion[]
  questionIds: string[]
  questionCount: number | null
  questionSelection: string
  randomized: boolean
  seed: string
  categories?: string[]
}): BankQuestion[] {
  const categories = (input.categories ?? []).map((c) => c.toLowerCase()).filter(Boolean)
  let pool = [...input.pool]
  if (categories.length) {
    pool = pool.filter((q) => {
      const section = (q.section || q.discipline || '').toLowerCase()
      return categories.includes(section)
    })
    if (!pool.length) pool = [...input.pool]
  }

  let selected: BankQuestion[] = []
  if (input.questionSelection === 'manual' || input.questionSelection === 'mixed') {
    const byId = new Map(pool.map((q) => [q.id, q]))
    selected = input.questionIds.map((id) => byId.get(id)).filter(Boolean) as BankQuestion[]
    if (input.questionSelection === 'mixed') {
      const remaining = pool.filter((q) => !selected.some((s) => s.id === q.id))
      const need = Math.max(0, (input.questionCount ?? selected.length) - selected.length)
      selected = [...selected, ...pickRandomSubset(remaining, need, `${input.seed}:mixed`)]
    }
  } else {
    const count = input.questionCount ?? Math.min(10, pool.length)
    selected = pickRandomSubset(pool, count, `${input.seed}:pick`)
  }

  if (input.questionCount != null && selected.length > input.questionCount) {
    selected = selected.slice(0, input.questionCount)
  }

  return input.randomized ? shuffleWithSeed(selected, `${input.seed}:order`) : selected
}

export function materializeQuestion(
  question: BankQuestion,
  sortOrder: number,
  seed: string,
  useDynamicParameters: boolean
): MaterializedItem {
  const itemSeed = `${seed}:q:${question.id}:${sortOrder}`
  const params =
    useDynamicParameters && question.parameters.length
      ? resolveParameters(question.parameters, itemSeed)
      : Object.fromEntries(
          question.parameters.map((p) => [
            p.key,
            Array.isArray(p.choices) && p.choices.length ? p.choices[0]! : p.min,
          ])
        )

  const resolvedPrompt = applyParametersToPrompt(question.prompt, params, question.parameters)
  const options =
    question.question_type === 'multiple_choice' || question.question_type === 'multiple_select'
      ? shuffleWithSeed(question.options, `${itemSeed}:opts`)
      : question.options
  const optionOrder = options.map((o) => o.id)

  const expected: Record<string, unknown> = {
    answerSpec: {
      ...question.answer_spec,
      // keep expression server-side only inside expected_answer column
    },
  }

  if (question.question_type === 'numeric') {
    const numeric = resolveExpectedNumeric(question.answer_spec, params)
    if (numeric) {
      expected.numeric = numeric
    }
  }

  return {
    question_id: question.id,
    sort_order: sortOrder,
    question_type: question.question_type,
    section: question.section,
    category: question.discipline,
    difficulty: question.difficulty,
    weight: question.weight,
    expected_time_sec: question.expected_time_seconds,
    resolved_prompt: resolvedPrompt,
    options_snapshot: options,
    option_order: optionOrder,
    parameters_resolved: params,
    expected_answer: expected,
    max_points: question.weight,
  }
}

export function materializeSessionItems(input: {
  questions: BankQuestion[]
  seed: string
  useDynamicParameters: boolean
}): MaterializedItem[] {
  return input.questions.map((q, index) =>
    materializeQuestion(q, index, input.seed, input.useDynamicParameters)
  )
}

/** Strip secrets before sending an item to the candidate browser. */
export function publicSessionItem(item: {
  id: string
  sort_order: number
  question_type: string
  section: string | null
  category: string | null
  difficulty: string | null
  weight: number
  expected_time_sec: number | null
  resolved_prompt: string
  options_snapshot: QuestionOption[]
  parameters_resolved: Record<string, number>
  opened_at?: string | null
  answered_at?: string | null
  scoring_status?: string
}) {
  return {
    id: item.id,
    sortOrder: item.sort_order,
    questionType: item.question_type,
    section: item.section,
    category: item.category,
    difficulty: item.difficulty,
    weight: item.weight,
    expectedTimeSec: item.expected_time_sec,
    prompt: item.resolved_prompt,
    options: item.options_snapshot,
    parameters: item.parameters_resolved,
    openedAt: item.opened_at ?? null,
    answeredAt: item.answered_at ?? null,
    answered: Boolean(item.answered_at),
  }
}
